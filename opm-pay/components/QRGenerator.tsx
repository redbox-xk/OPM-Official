import QRCode from 'qrcode.react';

export default function QRGenerator({ qrId }: { qrId: string }) {
    return <QRCode value={qrId} size={200} />;
}
