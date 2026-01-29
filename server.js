import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "100mb" }));

app.post("/render", async (req, res) => {
  const { html, pdfOptions } = req.body;
  if (!html) return res.status(400).json({ error: "html is required" });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();

    // важно: печать должна видеть фон/табличные стили
    await page.setContent(html, { waitUntil: ["domcontentloaded", "networkidle0"] });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "8mm", right: "4mm", bottom: "8mm", left: "4mm" },
      ...(pdfOptions || {})
    });

    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdf));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  } finally {
    await browser.close();
  }
});

app.listen(3001, () => console.log("Puppeteer PDF service: :3001"));
