import { Platform } from "react-native";
import * as Sharing from "expo-sharing";

/**
 * Captures the given ref (a View wrapping the summary card) as a PNG and shares/downloads it.
 * On web, ref.current is the underlying DOM node (react-native-web forwards it directly),
 * captured via html2canvas. On native, react-native-view-shot's captureRef handles it,
 * then the result is handed to the native share sheet.
 */
export async function shareSummaryCard(viewRef: React.RefObject<any>): Promise<void> {
  if (Platform.OS === "web") {
    const node = viewRef.current;
    if (!node) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(node, { backgroundColor: null, scale: 2 });

    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `vital-summary-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        resolve();
      }, "image/png");
    });
    return;
  }

  const { captureRef } = await import("react-native-view-shot");
  const uri = await captureRef(viewRef, { format: "png", quality: 1 });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share your weekly summary" });
  }
}
