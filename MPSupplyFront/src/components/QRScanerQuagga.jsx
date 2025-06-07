import React, { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';

const QRScannerQuagga = (props) => {
    const [started, setStarted] = useState(props.isStart);
    const [barcode, setBarcode] = useState('');

    useEffect(() => {
        return () => {
            if (props.isStart) stopScanner();
        };
    }, []);

    useEffect(() => {
        if (props.isStart) startScanner();
        else stopScanner();
    }, [props.isStart]);

    const _onDetected = res => {
        if (res.codeResult.code.indexOf('_') > 3) {
            props.setBarcode(res.codeResult.code)
            setBarcode(res.codeResult.code);
        }
    };

    const startScanner = () => {
        Quagga.init(
            {
                inputStream: {
                    type: 'LiveStream',
                    target: document.querySelector('#scanner-container'),
                    constraints: {
                        // facingMode: 'environment' // or user
                        facingMode: 'user' // or user
                    }
                },
                numOfWorkers: navigator.hardwareConcurrency,
                locate: true,
                frequency: 10,
                debug: {
                    drawBoundingBox: true,
                    showFrequency: true,
                    drawScanline: true,
                    showPattern: true
                },
                multiple: false,
                locator: {
                    halfSample: false,
                    patchSize: 'large', // x-small, small, medium, large, x-large
                    debug: {
                        showCanvas: false,
                        showPatches: false,
                        showFoundPatches: false,
                        showSkeleton: false,
                        showLabels: false,
                        showPatchLabels: false,
                        showRemainingPatchLabels: false,
                        boxFromPatches: {
                            showTransformed: false,
                            showTransformedBox: false,
                            showBB: false
                        }
                    }
                },
                decoder: {
                    readers: props.readers
                }
            },
            err => {
                if (err) {
                    return console.error(err);
                }
                Quagga.start();
                setStarted(true)
            }
        );
        Quagga.onDetected(_onDetected);
        Quagga.onProcessed(result => {
            let drawingCtx = Quagga.canvas.ctx.overlay,
                drawingCanvas = Quagga.canvas.dom.overlay;

            if (result) {
                if (result.boxes) {
                    drawingCtx.clearRect(
                        0,
                        0,
                        parseInt(drawingCanvas.getAttribute('width')),
                        parseInt(drawingCanvas.getAttribute('height'))
                    );
                    result.boxes.filter(box => box !== result.box).forEach(box => {
                        Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
                            color: 'green',
                            lineWidth: 2
                        });
                    });
                }

                if (result.codeResult && result.codeResult.code) {
                    Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
                }
            }
        });
    };

    const stopScanner = () => {
        Quagga.offProcessed();
        Quagga.offDetected();
        if (started) {
            Quagga.stop();
        }
    };

    return <div>
        {props.isStart && <React.Fragment>
            <div id="scanner-container" style={{width:'640px',height: '480px'}}/>
        </React.Fragment>}
    </div>
}

export default QRScannerQuagga;