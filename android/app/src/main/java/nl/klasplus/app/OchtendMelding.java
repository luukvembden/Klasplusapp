package nl.klasplus.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Haalt vlak voor de ochtendmelding het rooster van vandaag op en maakt er de tekst van, zonder de
 * webweergave (de app kan dan helemaal dicht zijn). Dit is een kopie van wat de app in TypeScript doet:
 * src/api/live/omzetten.ts (naarAfspraak), src/api/live/wijzigingen.ts en src/lib/ochtendmelding.ts.
 * Pas je daar iets aan, doe het hier ook.
 */
final class OchtendMelding {
    private OchtendMelding() {}

    static final class Tekst {
        final String titel;
        final String tekst;

        Tekst(String titel, String tekst) {
            this.titel = titel;
            this.tekst = tekst;
        }
    }

    private static final TimeZone NL = TimeZone.getTimeZone("Europe/Amsterdam");
    private static final String ACCOUNTS = "https://accounts.magister.net/connect/token";
    private static final String CLIENT_ID = "M6LOAPP";
    private static final int WACHTTIJD_MS = 4000;

    // ---- De inlogsleutels: dezelfde plek en versleuteling als de plugin SecureStorage ----
    // (node_modules/@aparajita/capacitor-secure-storage). De app leest ze daar ook weer uit.

    private static final String VOORKEUREN = "WSSecureStorageSharedPreferences";
    private static final String TOKEN_SLEUTEL = "capacitor-storage_tokens";
    private static final char SCHEIDING = '\u0010';
    private static final int BASE64 = Base64.NO_PADDING | Base64.NO_WRAP;

    private static SecretKey sleutel() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        KeyStore.SecretKeyEntry e = (KeyStore.SecretKeyEntry) ks.getEntry(TOKEN_SLEUTEL, null);
        return e == null ? null : e.getSecretKey();
    }

    private static JSONObject leesTokens(Context context) throws Exception {
        String opgeslagen = context.getSharedPreferences(VOORKEUREN, Context.MODE_PRIVATE).getString(TOKEN_SLEUTEL, null);
        SecretKey sleutel = sleutel();
        if (opgeslagen == null || sleutel == null) return null;
        int i = opgeslagen.indexOf(SCHEIDING);
        if (i < 0) return null;
        byte[] data = Base64.decode(opgeslagen.substring(0, i), BASE64);
        byte[] iv = Base64.decode(opgeslagen.substring(i + 1), BASE64);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, sleutel, new GCMParameterSpec(128, iv));
        return new JSONObject(new String(c.doFinal(data), StandardCharsets.UTF_8));
    }

    private static void bewaarTokens(Context context, JSONObject tokens) throws Exception {
        SecretKey sleutel = sleutel();
        if (sleutel == null) return;
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, sleutel);
        byte[] data = c.doFinal(tokens.toString().getBytes(StandardCharsets.UTF_8));
        String waarde = Base64.encodeToString(data, BASE64) + SCHEIDING + Base64.encodeToString(c.getIV(), BASE64);
        // commit en niet apply: de nieuwe sleutel moet echt bewaard zijn, de oude werkt niet meer.
        SharedPreferences.Editor e = context.getSharedPreferences(VOORKEUREN, Context.MODE_PRIVATE).edit();
        e.putString(TOKEN_SLEUTEL, waarde).commit();
    }

    /** Een geldig access token; vernieuwt het (en bewaart de nieuwe sleutels) als het verlopen is. */
    private static String accessToken(Context context) throws Exception {
        JSONObject tokens = leesTokens(context);
        if (tokens == null) return null;
        if (System.currentTimeMillis() < tokens.optLong("verlooptOp", 0) - 30_000) return tokens.getString("accessToken");

        String body = "client_id=" + CLIENT_ID + "&grant_type=refresh_token&refresh_token="
            + URLEncoder.encode(tokens.getString("refreshToken"), "UTF-8");
        HttpURLConnection v = open(ACCOUNTS);
        v.setRequestMethod("POST");
        v.setDoOutput(true);
        v.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        try (OutputStream uit = v.getOutputStream()) {
            uit.write(body.getBytes(StandardCharsets.UTF_8));
        }
        if (v.getResponseCode() != 200) return null;
        JSONObject a = new JSONObject(lees(v.getInputStream()));
        JSONObject nieuw = new JSONObject();
        nieuw.put("accessToken", a.getString("access_token"));
        nieuw.put("refreshToken", a.has("refresh_token") ? a.getString("refresh_token") : tokens.getString("refreshToken"));
        if (a.has("id_token")) nieuw.put("idToken", a.getString("id_token"));
        else if (tokens.has("idToken")) nieuw.put("idToken", tokens.getString("idToken"));
        nieuw.put("verlooptOp", System.currentTimeMillis() + (a.optLong("expires_in", 3600) - 60) * 1000);
        bewaarTokens(context, nieuw);
        return nieuw.getString("accessToken");
    }

    private static HttpURLConnection open(String adres) throws Exception {
        HttpURLConnection v = (HttpURLConnection) new URL(adres).openConnection();
        v.setConnectTimeout(WACHTTIJD_MS);
        v.setReadTimeout(WACHTTIJD_MS);
        v.setRequestProperty("Accept", "application/json");
        return v;
    }

    private static String lees(InputStream in) throws Exception {
        try (InputStream i = in) {
            ByteArrayOutputStream b = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = i.read(buf)) > 0) b.write(buf, 0, n);
            return b.toString("UTF-8");
        }
    }

    // ---- Het rooster ----

    private static final class Les {
        String id;
        long start;
        boolean heleDag;
        Integer lesuur;
        String omschrijving;
        String lokaal;
        String vak;
        List<String> docenten = new ArrayList<>();
        boolean eigen;
        boolean vervalt;
        boolean gewijzigd;
        boolean status3;
    }

    /** Null bij een fout of geen verbinding; anders de melding (of null-tekst als er vandaag geen lessen zijn). */
    static Tekst[] haalOp(Context context, String schoolUrl, long leerlingId, boolean ouder) throws Exception {
        String token = accessToken(context);
        if (token == null) return null;

        Calendar vandaag = Calendar.getInstance(NL);
        String dag = datum(vandaag.getTime());
        Calendar van = (Calendar) vandaag.clone();
        van.add(Calendar.DAY_OF_MONTH, -7);
        Calendar tot = (Calendar) vandaag.clone();
        tot.add(Calendar.DAY_OF_MONTH, 1);

        HttpURLConnection v = open(schoolUrl + "api/personen/" + leerlingId + "/afspraken?van=" + datum(van.getTime())
            + "&tot=" + datum(tot.getTime()));
        v.setRequestProperty("Authorization", "Bearer " + token);
        if (v.getResponseCode() != 200) return null;
        JSONArray items = new JSONObject(lees(v.getInputStream())).optJSONArray("Items");
        if (items == null) return null;

        List<Les> lessen = new ArrayList<>();
        for (int i = 0; i < items.length(); i++) {
            JSONObject r = items.getJSONObject(i);
            if (ouder && r.optInt("Type") == 1) continue;
            lessen.add(naarLes(r));
        }
        markeerEchteWijzigingen(lessen);

        List<Les> vanVandaag = new ArrayList<>();
        for (Les l : lessen) if (datum(new Date(l.start)).equals(dag)) vanVandaag.add(l);
        Tekst t = ochtendMelding(vanVandaag);
        return new Tekst[] { t };
    }

    private static String tekst(JSONObject o, String sleutel) {
        if (o == null || !o.has(sleutel) || o.isNull(sleutel)) return null;
        return o.optString(sleutel);
    }

    private static Les naarLes(JSONObject a) throws Exception {
        Les l = new Les();
        int type = a.optInt("Type");
        int status = a.optInt("Status");
        l.id = String.valueOf(a.opt("Id"));
        l.start = tijdstip(a.getString("Start"));
        l.heleDag = a.optBoolean("DuurtHeleDag", false);
        int uur = a.optInt("LesuurVan", 0);
        l.lesuur = uur == 0 ? null : uur;
        String omschrijving = tekst(a, "Omschrijving");
        if (omschrijving == null) omschrijving = "";
        l.omschrijving = type == 1 ? omschrijving : omschrijving.replaceAll("\\s+-\\s+", " – ").toUpperCase(Locale.ROOT);
        JSONArray lokalen = a.optJSONArray("Lokalen");
        String lokaal = lokalen != null && lokalen.length() > 0 ? tekst(lokalen.optJSONObject(0), "Naam") : null;
        l.lokaal = lokaal != null ? lokaal : tekst(a, "Lokatie");
        JSONArray vakken = a.optJSONArray("Vakken");
        l.vak = vakken != null && vakken.length() > 0 ? tekst(vakken.optJSONObject(0), "Naam") : null;
        JSONArray docenten = a.optJSONArray("Docenten");
        if (docenten != null) {
            for (int i = 0; i < docenten.length(); i++) {
                String naam = tekst(docenten.optJSONObject(i), "Naam");
                if (naam != null && !naam.isEmpty()) l.docenten.add(naam);
            }
        }
        l.eigen = type == 1;
        l.vervalt = status == 4 || status == 5;
        l.gewijzigd = !l.vervalt && (status == 9 || status == 10);
        l.status3 = status == 3;
        return l;
    }

    // wijzigingen.ts: status 3 is alleen een wijziging als docent of lokaal anders is dan in de andere weken.
    private static String zelfdeLes(Les l) {
        Calendar c = Calendar.getInstance(NL);
        c.setTimeInMillis(l.start);
        String vak = l.vak != null ? l.vak : l.omschrijving.split(" – ")[0];
        return vak + "|" + c.get(Calendar.DAY_OF_WEEK) + "|" + (l.lesuur != null ? l.lesuur.toString() : tijd(l.start));
    }

    private static String docentenVan(Les l) {
        List<String> d = new ArrayList<>(l.docenten);
        Collections.sort(d);
        return String.join(",", d);
    }

    private static void markeerEchteWijzigingen(List<Les> lijst) {
        Map<String, List<Les>> gewoon = new HashMap<>();
        for (Les l : lijst) {
            if (l.status3 || l.vervalt) continue;
            gewoon.computeIfAbsent(zelfdeLes(l), k -> new ArrayList<>()).add(l);
        }
        for (Les l : lijst) {
            if (!l.status3 || l.gewijzigd || l.vervalt) continue;
            List<Les> andere = new ArrayList<>();
            List<Les> kandidaten = gewoon.get(zelfdeLes(l));
            if (kandidaten != null) for (Les g : kandidaten) if (!g.id.equals(l.id)) andere.add(g);
            if (andere.isEmpty()) continue;
            boolean anders = true;
            for (Les g : andere) {
                boolean verschilt = !leeg(g.lokaal).equals(leeg(l.lokaal)) || !docentenVan(g).equals(docentenVan(l));
                if (!verschilt) anders = false;
            }
            if (anders) l.gewijzigd = true;
        }
    }

    // ochtendmelding.ts
    private static Tekst ochtendMelding(List<Les> lessen) {
        List<Les> rooster = new ArrayList<>();
        for (Les l : lessen) if (!l.heleDag && !l.eigen) rooster.add(l);
        if (rooster.isEmpty()) return null;
        Collections.sort(rooster, (a, b) -> Long.compare(a.start, b.start));

        Les eerste = null;
        for (Les l : rooster) if (!l.vervalt) { eerste = l; break; }

        List<String> zinnen = new ArrayList<>();
        if (eerste != null) {
            String uur = eerste.lesuur != null ? eerste.lesuur + "e uur, om" : "Om";
            zinnen.add(uur + " " + tijd(eerste.start) + (heeft(eerste.lokaal) ? " in " + eerste.lokaal : "") + ".");
        }
        for (Les l : rooster) if (l.vervalt) zinnen.add(vakVan(l) + " (" + welkUur(l) + ") is vervallen.");
        for (Les l : rooster) {
            if (!l.vervalt && l.gewijzigd) {
                zinnen.add(vakVan(l) + " (" + welkUur(l) + ") is gewijzigd" + (heeft(l.lokaal) ? ", nu in " + l.lokaal : "") + ".");
            }
        }
        return new Tekst(eerste != null ? "Eerste les: " + vakVan(eerste) : "Al je lessen vervallen vandaag", String.join(" ", zinnen));
    }

    private static String vakVan(Les l) {
        String s = l.vak != null ? l.vak : l.omschrijving;
        return s.isEmpty() ? s : s.substring(0, 1).toUpperCase(Locale.ROOT) + s.substring(1);
    }

    private static String welkUur(Les l) {
        return l.lesuur != null ? l.lesuur + "e uur" : tijd(l.start);
    }

    private static boolean heeft(String s) {
        return s != null && !s.isEmpty();
    }

    private static String leeg(String s) {
        return s == null ? "" : s;
    }

    // ---- Tijd, altijd in Nederlandse tijd ----

    private static String tijd(long ms) {
        SimpleDateFormat f = new SimpleDateFormat("HH:mm", Locale.ROOT);
        f.setTimeZone(NL);
        return f.format(new Date(ms));
    }

    private static String datum(Date d) {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT);
        f.setTimeZone(NL);
        return f.format(d);
    }

    /** "2026-11-10T07:30:00.0000000Z" of met "+01:00" erachter. */
    static long tijdstip(String s) throws Exception {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.ROOT);
        String rest = s.length() > 19 ? s.substring(19).replaceFirst("^\\.\\d+", "") : "";
        if (rest.isEmpty()) f.setTimeZone(NL);
        else if (rest.equals("Z")) f.setTimeZone(TimeZone.getTimeZone("UTC"));
        else f.setTimeZone(TimeZone.getTimeZone("GMT" + rest));
        return f.parse(s.substring(0, 19)).getTime();
    }
}
