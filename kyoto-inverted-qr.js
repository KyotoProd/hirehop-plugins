/*
 * Kyoto Productions - inverted QR reader for the HireHop Scanning page.
 *
 * HireHop's camera scanner does not read QR codes printed white on black.
 * While the built-in camera scanner is running, this plugin takes frames from
 * the same video, inverts them and tries to decode them. A successful read is
 * handed to HireHop's own scanner_success(), exactly as a normal camera scan.
 * It adds nothing else and does nothing on any other page.
 */
(function () {
	'use strict';

	var VERSION = '0.1.0';
	var INTERVAL_MS = 300;   // how often an inverted frame is tried
	var MAX_SIDE = 720;      // frames are scaled down to this before decoding
	var HOST_ID = 'kyoto_inverted_qr_host';

	if (typeof window.jQuery === 'undefined') return;
	if (!/^\/modules\/scanning(\/|$)/.test(window.location.pathname)) return;

	var $ = window.jQuery;
	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d', { willReadFrequently: true });
	var busy = false, reader = null, detector = null, badge = null;

	function getApp() {
		var el = $('.hh_scanning_app').first();
		if (!el.length) return null;
		try { return el.scanning_app('instance') || null; } catch (e) { return null; }
	}

	// Draw the source inverted (difference against white works in every browser)
	function drawInverted(source, w, h) {
		var scale = Math.min(1, MAX_SIDE / Math.max(w, h));
		canvas.width = Math.round(w * scale);
		canvas.height = Math.round(h * scale);
		ctx.globalCompositeOperation = 'source-over';
		ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = 'difference';
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = 'source-over';
	}

	function getReader() {
		if (reader) return reader;
		if (typeof window.Html5Qrcode === 'undefined') return null;
		if (!document.getElementById(HOST_ID)) {
			$('<div>', { id: HOST_ID, style: 'position:fixed;left:-9999px;top:0;width:300px;height:300px;' }).appendTo(document.body);
		}
		reader = new window.Html5Qrcode(HOST_ID, { verbose: false, experimentalFeatures: { useBarCodeDetectorIfSupported: false } });
		return reader;
	}

	// Resolves with the decoded text, or '' when nothing was found
	function decodeCanvas() {
		if (detector === null) {
			detector = false;
			if ('BarcodeDetector' in window) {
				try { detector = new window.BarcodeDetector(); } catch (e) { detector = false; }
			}
		}
		var viaLibrary = function () {
			var r = getReader();
			if (!r) return Promise.resolve('');
			return new Promise(function (resolve) {
				canvas.toBlob(function (blob) {
					if (!blob) return resolve('');
					var file = new File([blob], 'frame.png', { type: 'image/png' });
					r.scanFile(file, false).then(function (text) { resolve($.trim(text || '')); }, function () { resolve(''); });
				}, 'image/png');
			});
		};
		if (detector) {
			return detector.detect(canvas).then(function (codes) {
				if (codes && codes.length && $.trim(codes[0].rawValue) !== '') return $.trim(codes[0].rawValue);
				return viaLibrary();
			}, viaLibrary);
		}
		return viaLibrary();
	}

	function showBadge(app) {
		if (badge || !app.scan_panel) return;
		badge = $('<div>', {
			text: 'Inverted QR reader on (Kyoto plugin ' + VERSION + ')',
			style: 'font-size:0.8em;opacity:0.7;text-align:center;margin:2px 0;'
		}).appendTo(app.scan_panel);
	}

	function tick() {
		if (busy) return;
		var app = getApp();
		if (!app || !app.html5QrCode || typeof app.scanner_success !== 'function') return;
		var state;
		try { state = app.html5QrCode.getState(); } catch (e) { return; }
		if (state !== 2) return; // 2 = camera scanning
		var video = document.querySelector('#scan_video video');
		if (!video || video.readyState < 2 || !video.videoWidth) return;
		showBadge(app);
		busy = true;
		try { drawInverted(video, video.videoWidth, video.videoHeight); } catch (e) { busy = false; return; }
		decodeCanvas().then(function (text) {
			if (text !== '') app.scanner_success(text);
		}).then(function () { busy = false; }, function () { busy = false; });
	}

	$(function () { window.setInterval(tick, INTERVAL_MS); });

	// Small hook so the decoder can be checked without a camera
	window.kyotoInvertedQR = {
		version: VERSION,
		appFound: function () { return !!getApp(); },
		decodeImage: function (img) {
			drawInverted(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
			return decodeCanvas();
		}
	};

	if (window.console) console.log('Kyoto inverted QR plugin ' + VERSION + ' loaded');
})();
