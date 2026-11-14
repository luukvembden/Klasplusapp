package nl.klasplus.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Eigen plugin voor de ochtendmelding (OchtendPlugin); registreren vóór super.onCreate.
        registerPlugin(OchtendPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
