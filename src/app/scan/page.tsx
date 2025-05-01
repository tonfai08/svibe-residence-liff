"use client";
import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import liff from "@line/liff";

export default function ScanPage() {
  const [message, setMessage] = useState("⏳ กำลังโหลด LIFF...");
  const [isReady, setIsReady] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null); // ⭐ เพิ่ม state userId

  const appendLog = (text: string) => {
    console.log("text:", text);
    setLog((prev) => [...prev, text]);
  };

  useEffect(() => {
    const initLiff = async () => {
      appendLog("⏳ เริ่ม init LIFF");

      try {
        await liff.init({ liffId: "2007346714-EQX4gkv0" });
        appendLog("✅ LIFF init สำเร็จ");

        setMessage("✅ LIFF พร้อมแล้ว! สแกน QR ได้เลย");

        // ตรวจสอบ login
        if (!liff.isLoggedIn()) {
          appendLog("🔒 ยังไม่ login, redirect ไป login");
          liff.login();
          return;
        }

        // ดึง profile
        const profile = await liff.getProfile();
        setUserId(profile.userId);
        appendLog("👤 LINE User ID: " + profile.userId);

        setIsReady(true);

        // รอ DOM พร้อมก่อนเรียก scanner
        setTimeout(() => {
          const readerEl = document.getElementById("reader");
          if (!readerEl) {
            appendLog("❌ ไม่พบ element #reader");
            return;
          }

          const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: 250 },
            false
          );

          scanner.render(
            async (decodedText) => {
              appendLog("🎯 ได้ QR: " + decodedText);
              setMessage("QR ตรวจพบ: " + decodedText);
              try {
                const response = await fetch(
                  `https://svibe-residence.gipsic.app/api/visitor/confirm/${decodedText}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId }), // ✅ ส่ง userId ไปด้วย
                  }
                );
                const result = await response.json();
                alert("✅ ยืนยันแล้ว: " + JSON.stringify(result));
                appendLog("✅ API ตอบกลับ: " + JSON.stringify(result));
              } catch (err) {
                appendLog("❌ ยิง API ล้มเหลว: " + err);
                alert("❌ ยิง API ไม่สำเร็จ");
              }
            },
            (error) => appendLog("❌ Scan error: " + error)
          );
        }, 0);
      } catch (err) {
        appendLog("❌ LIFF init error: " + JSON.stringify(err));
        setMessage("❌ โหลด LIFF ไม่สำเร็จ");
      }
    };

    initLiff();
  }, []);

  return (
    <main className="p-4 text-center">
      <h1 className="text-xl font-bold mb-4">{message}</h1>
      {isReady && <div id="reader" className="mx-auto mb-6" />}
      <div className="text-left text-sm text-gray-500 max-w-md mx-auto">
        <h2 className="font-bold mb-1">📋 Logs:</h2>
        <ul className="bg-gray-100 p-2 rounded-md whitespace-pre-wrap max-h-60 overflow-auto">
          {log.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
