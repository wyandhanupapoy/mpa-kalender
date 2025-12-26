package com.mpa.himakom.kalender;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onBackPressed() {
        // Fix for back button on Login page: Minimize app if no history
        // This solves the issue where the back button becomes unresponsive on the root screen
        if (getBridge() != null && getBridge().getWebView() != null && !getBridge().getWebView().canGoBack()) {
            moveTaskToBack(true);
        } else {
            super.onBackPressed();
        }
    }
}
