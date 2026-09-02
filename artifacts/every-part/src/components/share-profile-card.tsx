import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download, ExternalLink, Printer, QrCode } from "lucide-react";

type ShareProfileCardProps = {
  churchName: string;
  profileUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadName(churchName: string) {
  const safeName = churchName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return `${safeName || "church"}-ministry-profile-qr.png`;
}

export function ShareProfileCard({ churchName, profileUrl }: ShareProfileCardProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [printBlocked, setPrintBlocked] = useState(false);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=640x640&margin=24&data=${encodeURIComponent(profileUrl)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const downloadQrCode = async () => {
    setIsDownloading(true);
    setDownloaded(false);
    setDownloadError(false);

    try {
      const response = await fetch(qrImageUrl);
      if (!response.ok) throw new Error("QR code download failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = downloadName(churchName);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setDownloaded(true);
      window.setTimeout(() => setDownloaded(false), 2500);
    } catch {
      setDownloadError(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const printSlide = () => {
    setPrintBlocked(false);
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setPrintBlocked(true);
      return;
    }

    const safeChurchName = escapeHtml(churchName);
    const safeProfileUrl = escapeHtml(profileUrl);
    const safeQrUrl = escapeHtml(qrImageUrl);

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>${safeChurchName} Ministry Profile</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            @page { size: landscape; margin: 0; }
            * { box-sizing: border-box; }
            html, body { width: 100%; height: 100%; margin: 0; }
            body { background: #f6f7f3; color: #203746; font-family: Arial, sans-serif; }
            .slide {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 8vw;
              padding: 9vw;
              background:
                radial-gradient(circle at 90% 15%, rgba(204, 166, 74, .24), transparent 22rem),
                linear-gradient(125deg, #f8f6ee 0%, #f0f7f5 100%);
            }
            .copy { max-width: 58%; }
            .eyebrow {
              margin: 0 0 1.5rem;
              color: #397f77;
              font-size: clamp(12px, 1.2vw, 20px);
              font-weight: 700;
              letter-spacing: .18em;
              text-transform: uppercase;
            }
            h1 {
              max-width: 10ch;
              margin: 0;
              font-size: clamp(44px, 7vw, 112px);
              line-height: .98;
              letter-spacing: -.06em;
            }
            .description {
              max-width: 30em;
              margin: 2rem 0 0;
              color: #5b6b73;
              font-size: clamp(18px, 2vw, 32px);
              line-height: 1.4;
            }
            .church { margin-top: 2.5rem; font-size: clamp(18px, 1.7vw, 28px); font-weight: 700; }
            .qr-card {
              flex: 0 0 min(30vw, 390px);
              padding: clamp(18px, 2vw, 32px);
              border-radius: 28px;
              background: #fff;
              box-shadow: 0 18px 50px rgba(32, 55, 70, .14);
              text-align: center;
            }
            .qr-card img { display: block; width: 100%; height: auto; }
            .scan { margin: 1rem 0 0; font-size: clamp(16px, 1.5vw, 24px); font-weight: 700; }
            .url { margin: .75rem 0 0; color: #69777b; font-size: clamp(10px, .9vw, 15px); word-break: break-all; }
          </style>
        </head>
        <body>
          <main class="slide">
            <section class="copy">
              <p class="eyebrow">A thoughtful next step</p>
              <h1>Every person has a part.</h1>
              <p class="description">Discover the gifts, passions, and ways you may enjoy serving in your church community.</p>
              <p class="church">${safeChurchName}</p>
            </section>
            <section class="qr-card">
              <img src="${safeQrUrl}" alt="QR code for the ${safeChurchName} Ministry Profile" />
              <p class="scan">Scan to begin your Ministry Profile</p>
              <p class="url">${safeProfileUrl}</p>
            </section>
          </main>
        </body>
      </html>`);
    printWindow.document.close();

    const qrImage = printWindow.document.querySelector("img");
    const openPrintDialog = () => {
        printWindow.focus();
        printWindow.print();
    };
    if (qrImage) {
      qrImage.addEventListener("load", openPrintDialog, { once: true });
      if (qrImage.complete) {
        openPrintDialog();
      }
    } else {
      openPrintDialog();
    }
  };

  return (
    <Card className="overflow-hidden border-primary/15 bg-card shadow-sm" data-testid="share-profile-card">
      <CardHeader className="border-b border-border/60 bg-muted/20">
        <CardTitle className="flex items-center gap-2 font-serif text-xl">
          <QrCode className="h-5 w-5 text-secondary" />
          Share the Ministry Profile
        </CardTitle>
        <CardDescription>
          Put this QR code on a Sunday screen, handout, or welcome table so people can begin the right profile for their age.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="mx-auto rounded-2xl border border-border/60 bg-white p-3 shadow-sm">
          <img
            src={qrImageUrl}
            alt={`QR code linking to the ${churchName} Ministry Profile`}
            className="h-44 w-44 sm:h-48 sm:w-48"
            loading="lazy"
          />
        </div>
        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Your public profile link</p>
            <p className="mt-1 break-all rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {profileUrl}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" onClick={copyLink} variant="outline" data-testid="button-copy-profile-link">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              type="button"
              onClick={downloadQrCode}
              variant="outline"
              disabled={isDownloading}
              data-testid="button-download-profile-qr"
            >
              {isDownloading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : downloaded ? (
                <Check className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isDownloading ? "Preparing…" : downloaded ? "Downloaded" : "Download QR"}
            </Button>
            <Button type="button" onClick={printSlide} variant="secondary" data-testid="button-print-profile-slide">
              <Printer className="h-4 w-4" />
              Print slide
            </Button>
            <Button type="button" variant="ghost" asChild>
              <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open public link
              </a>
            </Button>
          </div>
          {printBlocked && (
            <p className="text-sm text-destructive" role="alert">
              Your browser blocked the slide window. Allow pop-ups for Every Part and try again.
            </p>
          )}
          {downloadError && (
            <p className="text-sm text-destructive" role="alert">
              The QR download was blocked. Try again, or right-click the QR image and choose “Save image as…”.
            </p>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            The slide includes your church name, a short invitation, and this same QR code. Choose “Save to PDF” in the print dialog if you want a digital copy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}