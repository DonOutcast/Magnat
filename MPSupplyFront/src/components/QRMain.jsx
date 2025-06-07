import React, {useEffect, useState} from 'react';
import {Html5Qrcode} from "html5-qrcode";

const QRMain = (props) => {
    const [res, setRes] = useState('')

    useEffect(() => {
        Html5Qrcode.getCameras().then(devices => {
            /**
             * devices would be an array of objects of type:
             * { id: "id", label: "label" }
             */
            if (devices && devices.length) {
                var cameraId = devices[0].id;
                const html5QrCode = new Html5Qrcode(/* element id */ "reader");
                html5QrCode.start(
                    cameraId,
                    {
                        fps: 10,    // Optional, frame per seconds for qr code scanning
                    },
                    (decodedText, decodedResult) => {
                        props.setBarcode(decodedText)
                        html5QrCode.stop()
                        // do something when code is read
                    },
                    (errorMessage) => {
                        // parse error, ignore it.
                    })
                    .catch((err) => {
                        // Start failed, handle it.
                    });
                // .. use this to start scanning.
            }
        }).catch(err => {
            // handle err
        });
    }, []);

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

export default QRMain