package nl.klasplus.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * De ochtendmelding op Android. De app geeft een plan door (per dag: tijdstip en de tekst met de stand
 * van dat moment). Op het tijdstip wekt Android de app, die dan snel het rooster van vandaag ophaalt. Lukt
 * dat binnen een paar seconden, dan komt de melding met de stand van nu; anders met de tekst uit het plan.
 * Zonder icoontje in de statusbalk: het is geen wekker. In de diepe slaapstand krijgt de app alleen
 * internet als hij bij de batterij op "Onbeperkt" staat; anders valt hij terug op de tekst uit het plan.
 */
public class OchtendWekker extends BroadcastReceiver {
    static final String ACTIE = "nl.klasplus.app.OCHTEND";
    private static final String VOORKEUREN = "klasplus_ochtend";
    private static final String PLAN = "plan";
    private static final String KANAAL = "klasplus";
    /** Dezelfde nummers als de ochtendmeldingen in notificaties.ts. */
    private static final int MELDING = 6000;
    /** Hoe lang we hooguit wachten op het rooster; Android geeft een ontvanger ongeveer tien seconden. */
    private static final long WACHTEN_MS = 8000;

    // ---- Plan bewaren en de volgende wekker zetten ----

    static void bewaarPlan(Context context, JSONObject plan) {
        prefs(context).edit().putString(PLAN, plan.toString()).commit();
        zetVolgende(context);
    }

    static void wisPlan(Context context) {
        prefs(context).edit().remove(PLAN).commit();
        alarm(context).cancel(wekIntent(context));
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(VOORKEUREN, Context.MODE_PRIVATE);
    }

    private static AlarmManager alarm(Context context) {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }

    private static PendingIntent wekIntent(Context context) {
        Intent i = new Intent(context, OchtendWekker.class).setAction(ACTIE);
        return PendingIntent.getBroadcast(context, MELDING, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static JSONObject leesPlan(Context context) {
        try {
            String s = prefs(context).getString(PLAN, null);
            return s == null ? null : new JSONObject(s);
        } catch (Exception e) {
            return null;
        }
    }

    /** Zet de wekker op de eerstvolgende dag in het plan (of haalt hem weg als er niets meer komt). */
    static void zetVolgende(Context context) {
        AlarmManager am = alarm(context);
        PendingIntent pi = wekIntent(context);
        am.cancel(pi);
        JSONObject plan = leesPlan(context);
        JSONArray dagen = plan == null ? null : plan.optJSONArray("dagen");
        if (dagen == null) return;
        long nu = System.currentTimeMillis();
        long volgende = Long.MAX_VALUE;
        for (int i = 0; i < dagen.length(); i++) {
            long op = dagen.optJSONObject(i).optLong("op");
            if (op > nu && op < volgende) volgende = op;
        }
        if (volgende == Long.MAX_VALUE) return;
        boolean precies = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
        if (precies) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, volgende, pi);
        else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, volgende, pi);
    }

    // ---- De wekker gaat ----

    @Override
    public void onReceive(Context context, Intent intent) {
        String actie = intent.getAction();
        if (!ACTIE.equals(actie)) {
            // Na opnieuw opstarten of een update zijn wekkers weg: opnieuw zetten.
            zetVolgende(context);
            return;
        }

        JSONObject plan = leesPlan(context);
        JSONObject dag = huidigeDag(plan);
        zetVolgende(context);
        if (plan == null || dag == null) return;

        final PendingResult klaar = goAsync();
        final Context app = context.getApplicationContext();
        new Thread(() -> {
            try {
                toon(app, plan, dag);
            } finally {
                klaar.finish();
            }
        }).start();
    }

    /** De dag waarvoor de wekker nu gaat: het laatste tijdstip dat net voorbij is (niet ouder dan een uur). */
    private static JSONObject huidigeDag(JSONObject plan) {
        JSONArray dagen = plan == null ? null : plan.optJSONArray("dagen");
        if (dagen == null) return null;
        long nu = System.currentTimeMillis();
        JSONObject beste = null;
        for (int i = 0; i < dagen.length(); i++) {
            JSONObject d = dagen.optJSONObject(i);
            long op = d.optLong("op");
            if (op <= nu + 60_000 && op > nu - 3_600_000 && (beste == null || op > beste.optLong("op"))) beste = d;
        }
        return beste;
    }

    private static void toon(Context context, JSONObject plan, JSONObject dag) {
        String titel = dag.optString("titel");
        String tekst = dag.optString("tekst");

        // Het rooster ophalen in een eigen draad, zodat we niet langer wachten dan Android toestaat.
        AtomicReference<OchtendMelding.Tekst[]> vers = new AtomicReference<>();
        CountDownLatch opgehaald = new CountDownLatch(1);
        Thread ophalen = new Thread(() -> {
            try {
                vers.set(OchtendMelding.haalOp(context, plan.getString("schoolUrl"), plan.getLong("leerlingId"), plan.optBoolean("ouder")));
            } catch (Exception e) {
                // Geen verbinding of iets onverwachts: dan de tekst uit het plan.
            } finally {
                opgehaald.countDown();
            }
        });
        ophalen.start();
        try {
            opgehaald.await(WACHTEN_MS, TimeUnit.MILLISECONDS);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }

        OchtendMelding.Tekst[] uitkomst = vers.get();
        if (uitkomst != null) {
            // Vandaag toch geen lessen (meer): dan ook geen melding.
            if (uitkomst[0] == null) return;
            titel = uitkomst[0].titel;
            tekst = uitkomst[0].tekst;
        }
        stuur(context, titel, tekst);
    }

    private static void stuur(Context context, String titel, String tekst) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(KANAAL) == null) {
            NotificationChannel k = new NotificationChannel(KANAAL, "Klas+", NotificationManager.IMPORTANCE_HIGH);
            k.setDescription("Nieuwe cijfers, roosterwijzigingen en herinneringen");
            k.enableVibration(true);
            nm.createNotificationChannel(k);
        }
        Intent open = new Intent(context, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent bijTikken = PendingIntent.getActivity(context, MELDING, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(context, KANAAL)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(titel)
            .setContentText(tekst)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(tekst))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(bijTikken)
            .setAutoCancel(true);
        try {
            NotificationManagerCompat.from(context).notify(MELDING, b.build());
        } catch (SecurityException e) {
            // Geen toestemming voor meldingen.
        }
    }
}
