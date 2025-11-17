"use client";

import Script from "next/script";

export default function SidebarAd(props: { state: string }) {
  if (props.state === "collapsed") {
    return;
  }

  return (
    <div className="w-full p-2">
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
          minHeight: "250px",
        }}
        data-ad-client="SEU_CLIENT_ID"
        data-ad-slot="SLOT_ID"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />

      <Script id="ads-run">
        {`(adsbygoogle = window.adsbygoogle || []).push({});`}
      </Script>
    </div>
  );
}
