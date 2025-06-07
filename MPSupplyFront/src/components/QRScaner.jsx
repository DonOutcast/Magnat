import React, {useEffect, useState} from 'react';
import { useHtml5QrCodeScanner } from 'react-html5-qrcode-reader';
// import {Html5QrcodeScanner} from "html5-qrcode";

const QRScaner = () => {
    const [res, setRes] = useState('')
    const { Html5QrcodeScanner } = useHtml5QrCodeScanner(
        process.env.PUBLIC_URL + '/html5-qrcode.min.js'
    );

    useEffect(() => {
        if (Html5QrcodeScanner) {
            // Creates anew instance of `HtmlQrcodeScanner` and renders the block.
            let html5QrcodeScanner = new Html5QrcodeScanner(
                "reader",
                // { fps: 10, qrbox: {width: 500, height: 200} },
                { fps: 10 },
                /* verbose= */ false);
            html5QrcodeScanner.render(
                (data) => {
                    setRes(data)
                    html5QrcodeScanner.close()
                }
            );
        }
    }, [Html5QrcodeScanner]);

    // beware: id must be the same as the first argument of Html5QrcodeScanner
    return (
        <div>
            <div style={{width: '640px', height: '480px'}} id="reader"></div>
            <div>
                {res}
            </div>
        </div>
    );
}

export default QRScaner