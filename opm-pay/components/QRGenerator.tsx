import QRCode from 'qrcode.react';

export default function QRGenerator({ qrId }: { qrId: string }) {
    return (
        <div>
            <QRCode value={qrId} size={200} />
            <p>Scan to pay with OPM</p>
        </div>
    );
}
