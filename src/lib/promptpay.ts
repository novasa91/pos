// PromptPay QR generator — สร้าง EMVCo QR code สำหรับ PromptPay
// ตามมาตรฐาน ธปท. (Bank of Thailand)
// https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Pages/EMVCo.aspx

function crc16ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export function buildPromptPayQR(
  phoneOrId: string,
  amount: number
): string {
  // Tag 00: Payload Format Indicator
  // Tag 01: Point of Initiation Method (12 = dynamic, with amount)
  // Tag 29: Merchant Account Information (PromptPay)
  // Tag 53: Transaction Currency (764 = THB)
  // Tag 54: Transaction Amount
  // Tag 58: Country Code (TH)
  // Tag 63: CRC

  // Build merchant account info
  // Tag 00: AID (PromptPay = A000000677010111)
  // Tag 01: Mobile number or Tax ID
  // For mobile: country code (66) + leading 0 stripped
  // For tax ID: 13 digits

  let target = phoneOrId.replace(/[^0-9]/g, "");
  if (target.length === 10 && target.startsWith("0")) {
    target = "0066" + target.substring(1);
  } else if (target.length === 13) {
    // Tax ID
  } else if (target.length === 11 && target.startsWith("0")) {
    // Some formats include the leading 0
  }

  const aid = "A000000677010111";
  const merchantInfo = tlv("00", aid) + tlv("01", target);

  // Build full payload WITHOUT CRC
  const payload =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("29", merchantInfo) +
    tlv("53", "764") +
    tlv("54", amount.toFixed(2)) +
    tlv("58", "TH");

  // Add CRC
  const withCrcField = payload + "6304";
  const crc = crc16ccitt(withCrcField);
  return withCrcField + crc;
}

export const PROMPTPAY_DEMO = {
  // สำหรับเดโม - เบอร์ PromptPay ของร้าน (เปลี่ยนได้ใน settings)
  phone: "0812345678",
  name: "ร้านส้มตำลุงสมชาย",
};
