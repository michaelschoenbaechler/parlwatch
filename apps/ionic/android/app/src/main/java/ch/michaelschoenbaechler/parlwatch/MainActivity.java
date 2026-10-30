package ch.michaelschoenbaechler.parlwatch;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.util.Locale;

public class MainActivity extends BridgeActivity {

    private int topInsetDp = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Before Android 15 the WebView reports the navigation bar as 0 through env(), so Capacitor's SystemBars
        // handling leaves it covering the page. Replace its listener: pad the bottom natively, hand only the top to CSS.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            handleInsetsBeforeEdgeToEdge();
        }
    }

    private void handleInsetsBeforeEdgeToEdge() {
        View decorView = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (view, insets) -> {
            int bars = WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout();
            Insets barInsets = insets.getInsets(bars);
            Insets bottomInsets = insets.getInsets(bars | WindowInsetsCompat.Type.ime());
            view.setPadding(barInsets.left, 0, barInsets.right, bottomInsets.bottom);

            topInsetDp = Math.round(barInsets.top / getResources().getDisplayMetrics().density);
            injectSafeAreaCss();

            return new WindowInsetsCompat.Builder(insets).setInsets(bars, Insets.NONE).build();
        });

        bridge.addWebViewListener(
            new WebViewListener() {
                @Override
                public void onPageCommitVisible(WebView webView, String url) {
                    injectSafeAreaCss();
                }
            }
        );
    }

    private void injectSafeAreaCss() {
        String script = String.format(
            Locale.US,
            "document.documentElement && ['top', 'right', 'bottom', 'left'].forEach(side => " +
            "document.documentElement.style.setProperty('--safe-area-inset-' + side, side === 'top' ? '%dpx' : '0px'));",
            topInsetDp
        );
        bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(script, null));
    }
}
