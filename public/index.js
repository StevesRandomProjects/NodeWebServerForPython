var socket = io(); //load socket.io-client and connect to the host that serves the page

/************PROCESS DATA FROM WEB CLIENT****************************/

window.addEventListener("load", function(){ //when page loads
  if(('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)) 	{
    //alert('Mobile'); 
    document.addEventListener("touchstart", ReportTouchStart, false);
    document.addEventListener("touchend", ReportTouchEnd, false);
 //   document.addEventListener("touchmove", ReportTouchMove, false);
  }else{
    //alert('Desktop'); 
    document.addEventListener("touchstart", ReportTouchStart, false);
    document.addEventListener("touchend", ReportTouchEnd, false);
    document.addEventListener("touchmove", ReportTouchMove, false);
    document.addEventListener("mouseup", ReportMouseUp, false);
    document.addEventListener("mousedown", ReportMouseDown, false);
//    document.addEventListener("mousemove", ReportMouseMove, false);
  }
  
});

function ReportOnClick(e) {
  socket.emit('msg','{"'+e.target.id+'":2}');
  document.getElementById("DebugData").innerHTML = '{"'+e+'":2}';
}

function ReportOnDblClick(e) {
  socket.emit('msg','{"'+e.target.id+'":3}');
  document.getElementById("DebugData").innerHTML = '{"'+e+'":3}';
}

function ReportOnMouseDown(e) {
  socket.emit('msg','{"'+e.target.id+'":1}');
  document.getElementById("DebugData").innerHTML = '{"'+e+'":1}';
}

function ReportOnMouseUp(e) {
  socket.emit('msg','{"'+e.target.id+'":0}');
  document.getElementById("DebugData").innerHTML = '{"'+e+'":0}';
}

function ReportTouchStart(e) {
	if (e.target.className != "serialtext") { // prevents e.preventDefault so keyboard will pop up
		e.preventDefault();   // Call preventDefault() to prevent sending auto generated mouse event
	}
	if (e.target.className != 'range-slider') { // don't report button presses on slider
		socket.emit('msg','{"'+e.target.id+'":1}');
		document.getElementById("DebugData").innerHTML = '{"'+e.target.id+'":1}';
	}
}

function ReportTouchEnd(e) {
	if (e.target.className != "serialtext") { // prevents e.preventDefault so keyboard will pop up
		e.preventDefault();   // Call preventDefault() to prevent sending auto generated mouse event
	}
	if (e.target.className != 'range-slider') {  // don't report button presses on slider
		socket.emit('msg','{"'+e.target.id+'":0}');	
		document.getElementById("DebugData").innerHTML = '{"'+e.target.id+'":0}';
	}
	
}

function ReportTouchMove(e) {
	if (e.target.className != "serialtext") { // prevents e.preventDefault so keyboard will pop up
		e.preventDefault();   // Call preventDefault() to prevent sending auto generated mouse event
	}
	socket.emit('TouchMove',e.offsetX,e.offsetY);
}

function ReportMouseDown(e) {
  if (e.target.className != 'range-slider') {
    socket.emit('msg','{"'+e.target.id+'":1}');
    document.getElementById("DebugData").innerHTML = '{"'+e.target.id+'":1}';
  }
}


function ReportMouseUp(e) {
  // className is used to prevent sending mouseup report when mouse is on slider.
  if (e.target.className === 'range-slider') {
    console.log("volume class detected");
  } else {
      socket.emit('msg','{"'+e.target.id+'":0}');
      document.getElementById("DebugData").innerHTML = '{"'+e.target.id+'":0}';
  }
}

function ReportMouseMove(e) {
  socket.emit('TouchMove',e.offsetX,e.offsetY); 
}

var ConsoleText = "";

/************PROCESS DATA FROM WEBSERVER****************************/

//Feedback from server to display active feedback on the browser
socket.on('FB',function (data) {  
  console.log('DataFromServer'+data.toString()+'!');
  var obj2 = JSON.parse(data.toString()); // Convert to JSON format
  var keys = Object.keys(obj2);
  var result = Object.keys(obj2).map(function(e) {
    return obj2[e]
  })
  var id = keys[0];
  //console.log('id='+id);
  //console.log('value='+result);
  
  if (id != null) {
    if(document.querySelector('#' + id) != null) {
      console.log(document.querySelector('#' + id));
      var className = document.querySelector('#' + id).className;
      if (className !== null) { // this object as a classname
	console.log('id='+id+'; className='+className)+" value="+result;	
	if (className.startsWith('switch'))  {
	    if (result == 1) { document.getElementById(id).classList='switch active';}
	    else document.getElementById(id).classList='switch inactive';
	} else if (className.startsWith('btn_source')) {
	    if (result == 1) { document.getElementById(id).classList='btn_source active';}
	    else document.getElementById(id).classList='btn_source inactive';
	} else if (className.startsWith('btn') ) {
	    if (result == 1) { document.getElementById(id).classList='btn active';}
	    else document.getElementById(id).classList='btn inactive';
	} else if (className == 'range-slider') {
	  document.getElementById(id).value = result;
	  if (id == 'A1') {
	    var sliderDiv = document.getElementById("volume"); // This updates the digital volume gauge
	    sliderDiv.innerHTML = result; // This updates the digital volume gauge
	  }
	} else if (className == 'serialtext') {
	  document.getElementById(id).innerHTML = result;
	  if (id==="S3") { // Reading serial text from DOM on IE does not work.  So we have to save text to a variable.
	    ConsoleText += result;
	    document.getElementById(id).value = ConsoleText;
	    //document.getElementById(id).value = document.getElementById(id).value + result;
	  }
	}
      } else {// the following elements do not have a special feedback class
	if (document.getElementById(id).value != null) {// This object has no class name but has a value parameter
	  console.log("ID="+id+"has a value assignment but no className");
	  document.getElementById(id).value = result;
	} else if (document.getElementById(id).checked != null) {// This object is a checkbox
	  console.log("ID="+id+" has a checkbox assignment but no className");
	  document.getElementById(id).checked = result;
	}	
      }

    }
  }
});




/** valueChanged function updates volume when user adjustes the volume slider**/

function valueChanged(e){
  let a = e.value;

  // This updates the bar volume gauage
  var sliderDiv = document.getElementById("A1");
  sliderDiv.innerHTML = a;

  // This updates the digital volume gauge
  var volume = document.getElementById("volume");
  volume.innerHTML = a;

  // This sends the new volume level to Server
  socket.emit('msg','{"A1":'+a+'}');
  document.getElementById("DebugData").innerHTML = '{"A1":'+a+'}';
}


/************************ PROCESS CHAT BOX TEXT **************************/
function normalizeNewlines(text)
{  // This function is to correct for issues with Internet Explorer
    return text.replace(/(\r\n|\r|\n)/g, '\r\n');
}


function ClearText() {
  ConsoleText = '';
  document.getElementById('S3').value = ConsoleText;
  
}

function addText(event) {
    
    var targ = event.target || event.srcElement;
    document.getElementById("S3").value += targ.textContent || targ.innerText;
    console.log(targ);
}



function getText(ID) {
  if (ID==="S2") {
    var textarea = document.getElementById('S2');
    socket.emit('msg','{"S2":"'+textarea.value+ '\\r"}');
    
    console.log(textarea.value);
    //document.getElementById('S3').value = textarea.value + '\r'; // copy command to output screen
    textarea.value = '';  // clear text after sending
  } 
  document.activeElement.blur(); // this removes focus from the textarea
}

// This function allows the keyboard pop up to disappear when client presents the enter key
function onTextAreaChange(ID) {
  var key = window.event.keyCode;

  // If the user has pressed enter
  if (key === 13) {
    console.log("Enter Key was pressed");
    getText(ID);
    if(event.preventDefault) { // This prevents the browser from going to next line.
      event.preventDefault(); // This should fix it
      return false; // Just a workaround for old browsers
    }
    return false;
  }
  else {
    return true;
  }
}

