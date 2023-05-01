var canvas = new fabric.Canvas('mainCanvas', {
	selection: false, //Disable dragging a selection box.
	preserveObjectStacking: true //Ensure the spirit images don't jump in front of the blank marker image when selected.
});

//The dimensions of the blank marker image.
var canvasWidth = 1332;
var canvasHeight = 1332;

//Geometry of marker images obtained in GIMP. Enable Windows > Dockable Dialogues > Pointer.
//Use magic wand tool to select holes in blank marker image; read bounding box of selection from pointer window.
//Need to move top and left up and left by 1, and increase width and height by 1.
var clipWidth = 568;
var clipHeight = 568;
var clip1X = 710;
var clip1Y = 92;
var clip2X = 74;
var clip2Y = 690;

var imageName = 'marker.png'; //The file name to download as.


//Clear the existing spirit image (to make room for a new one).
function clearCanvas() {
	canvas.clear();
	
	//Set up the blank marker image.
	fabric.Image.fromURL('blank-spirit-marker.png', function(img) {
		img.set('left', 0).set('top', 0);
		img.set('width', canvasWidth).set('height', canvasHeight);
		img.set('selectable', false);
		img.set('evented', false); //To ensure you never try to interact with it, and can select/move things behind it.
		canvas.add(img);
	});
}

clearCanvas(); //First set up of the canvas.

//A callback function for adding spirit images to the canvas.
function addSpiritImage(img) {
	clearCanvas();
	img.scaleToHeight(clipHeight); //Default to filling the clipping area.
	img.set('left', clip1X).set('top', clip1Y); //Start in the clipping area.
	//Clip to the area inside the upper-right hole.
	img.set('clipPath', new fabric.Rect({
		absolutePositioned: true,
		left: clip1X,
		top: clip1Y,
		width: clipWidth,
		height: clipHeight
	}));
	img.setControlsVisibility({mt: false, mb: false, ml: false, mr: false}); //Disable the aspect ratio non-preserving scaling handles.
	img.setControlsVisibility({mtr: false}); //Disable the rotation handle.
	
	canvas.add(img);
	canvas.sendToBack(img); //Ensure it renders behind the blank marker image.
	
	img.clone(function(imgCpy) {
		imgCpy.set('left', clip2X).set('top', clip2Y); //Start in the other clipping area.
		//Clip to the area inside the lower-left hole.
		imgCpy.set('clipPath', new fabric.Rect({
			absolutePositioned: true,
			left: clip2X,
			top: clip2Y,
			width: clipWidth,
			height: clipHeight
		}));
		imgCpy.set('selectable', false).set('evented', false); //The copy should not be directly interactable.
		
		canvas.add(imgCpy);
		canvas.sendToBack(imgCpy); //Ensure it renders behind the blank marker image.
		
		//Set up events to make the copy mirror the main as it moves and scales.
		function mirror() {
			imgCpy.scaleToHeight(img.getScaledHeight());
			imgCpy.set('left', img.left - clip1X + clip2X).set('top', img.top - clip1Y + clip2Y);
		}
		img.on('moving', mirror);
		img.on('scaling', mirror);
	});
}

//A wrapper around the above function that takes a list of files objects.
function handleSpiritImageEvent(files) {
	if(files.length > 0){
		for (var i = 0, f; f = files[i]; i++) {
			//Only process image files.
			if (f.type.match('image.*')) {
				var reader = new FileReader();
				//Define a listener on the reader object for the onload event.
				reader.onload = function(evt) {
					fabric.Image.fromURL(evt.target.result, addSpiritImage, {crossOrigin: 'Anonymous'});
				};
				//Read in the image file as a data URL, firing on the onload listener, which uses the URL.
				reader.readAsDataURL(f);
			}
		}
	}
}

//Load in images when selected with the file browser input.
function uploadImage() {
	handleSpiritImageEvent(document.getElementById('fileSelector').files);
}

//Load in images when dragged and dropped in.
//Based on https://stackoverflow.com/a/73555394
canvas.on('drop', function(event) {
	//Prevent the browser's default behaviour of opening the file.
	event.e.stopPropagation();
	event.e.stopImmediatePropagation();
	event.e.preventDefault();
	
	//Use DataTransfer interface to access the file(s).
	handleSpiritImageEvent(event.e.dataTransfer.files);
});

//A function to save the image, called by the HTML button.
function saveImage() {
	var link = document.createElement('a');
	link.setAttribute('download', imageName);
	link.setAttribute('href', canvas.toDataURL({format: 'png'}));
	link.click();
	link.remove();
}
