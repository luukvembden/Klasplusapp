package nl.klasplus.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

/** De brug tussen de app (src/lib/ochtendNative.ts) en OchtendWekker. */
@CapacitorPlugin(name = "Ochtend")
public class OchtendPlugin extends Plugin {

    /** { schoolUrl, leerlingId, ouder, dagen: [{ op, titel, tekst }] } */
    @PluginMethod
    public void plan(PluginCall call) {
        try {
            OchtendWekker.bewaarPlan(getContext(), new JSONObject(call.getData().toString()));
            call.resolve();
        } catch (Exception e) {
            call.reject("Plan niet bewaard");
        }
    }

    @PluginMethod
    public void wis(PluginCall call) {
        OchtendWekker.wisPlan(getContext());
        call.resolve();
    }

    /** Staat Klas+ bij de batterij op "Onbeperkt" (niet geoptimaliseerd)? */
    @PluginMethod
    public void batterij(PluginCall call) {
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        JSObject uit = new JSObject();
        uit.put("onbeperkt", pm != null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName()));
        call.resolve(uit);
    }

    /** Vraagt de telefoon om Klas+ op de achtergrond te laten draaien (of opent de batterij-instellingen). */
    @PluginMethod
    public void vraagBatterij(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(i);
        } catch (Exception e) {
            try {
                getActivity().startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
            } catch (Exception ignored) {
                // Geen scherm hiervoor op deze telefoon.
            }
        }
        call.resolve();
    }
}
