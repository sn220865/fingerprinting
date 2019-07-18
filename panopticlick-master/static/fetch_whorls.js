$("#flashcontent").flash(
  {
    "src": "static/fonts2.swf",
    "width": "1",
    "height": "1",
    "swliveconnect": "true",
    "id": "flashfontshelper",
    "name": "flashfontshelper"
  },
  { update: false }
);

function identify_plugins(){
  // fetch and serialize plugins
  var plugins = "";
  // in Mozilla and in fact most non-IE browsers, this is easy
  if (navigator.plugins) {
    var np = navigator.plugins;
    var plist = new Array();
    // sorting navigator.plugins is a right royal pain
    // but it seems to be necessary because their order
    // is non-constant in some browsers
    for (var i = 0; i < np.length; i++) {
      plist[i] = np[i].name + "; ";
      plist[i] += np[i].description + "; ";
      plist[i] += np[i].filename + ";";
      for (var n = 0; n < np[i].length; n++) {
        plist[i] += " (" + np[i][n].description +"; "+ np[i][n].type +
                   "; "+ np[i][n].suffixes + ")";
      }
      plist[i] += ". ";
    }
    plist.sort(); 
    for (i = 0; i < np.length; i++)
      plugins+= "Plugin "+i+": " + plist[i];
  }
  // in IE, things are much harder; we use PluginDetect to get less
  // information (only the plugins listed below & their version numbers)
  if (plugins == "") {
    var pp = new Array();
    pp[0] = "Java"; pp[1] = "QuickTime"; pp[2] = "DevalVR"; pp[3] = "Shockwave";
    pp[4] = "Flash"; pp[5] = "WindowsMediaplayer"; pp[6] = "Silverlight"; 
    pp[7] = "VLC";
    var version;
    for ( p in pp ) {
      version = PluginDetect.getVersion(pp[p]);
      if (version) 
        plugins += pp[p] + " " + version + "; "
    }
    plugins += ieAcrobatVersion();
  }
  return plugins;
}

function ieAcrobatVersion() {
  // estimate the version of Acrobat on IE using horrible horrible hacks
  if (window.ActiveXObject) {
    for (var x = 2; x < 10; x++) {
      try {
        oAcro=eval("new ActiveXObject('PDF.PdfCtrl."+x+"');");
        if (oAcro) 
          return "Adobe Acrobat version" + x + ".?";
      } catch(ex) {}
    }
    try {
      oAcro4=new ActiveXObject('PDF.PdfCtrl.1');
      if (oAcro4)
        return "Adobe Acrobat version 4.?";
    } catch(ex) {}
    try {
      oAcro7=new ActiveXObject('AcroPDF.PDF.1');
      if (oAcro7)
        return "Adobe Acrobat version 7.?";
    } catch (ex) {}
    return "";
  }
}

function get_fonts(js_fonts, cb) {
  // Try flash first
	var fonts = "";
	var obj = document.getElementById("flashfontshelper");
	if (obj && typeof(obj.GetVariable) != "undefined") {
		fonts = obj.GetVariable("/:user_fonts");
    fonts = fonts.replace(/,/g,", ");
    fonts += " (via Flash)";
	} else {
    // Try java fonts
    try {
      var javafontshelper = document.getElementById("javafontshelper");
      var jfonts = javafontshelper.getFontList();
      for (var n = 0; n < jfonts.length; n++) {
        fonts = fonts + jfonts[n] + ", ";
      }
    fonts += " (via Java)";
    } catch (ex) {}
  }
  if ("" == fonts){
    return js_fonts.join(", ") + " (via javascript)";
  } else {
    return fonts;
  }
}

function set_dom_storage(){
  try { 
    localStorage.panopticlick = "yea";
    sessionStorage.panopticlick = "yea";
  } catch (ex) { }
}

function test_dom_storage(){
  var supported = "";
  try {
    if (localStorage.panopticlick == "yea") {
       supported += "DOM localStorage: Yes";
    } else {
       supported += "DOM localStorage: No";
    }
  } catch (ex) { supported += "DOM localStorage: No"; }

  try {
    if (sessionStorage.panopticlick == "yea") {
       supported += ", DOM sessionStorage: Yes";
    } else {
       supported += ", DOM sessionStorage: No";
    }
  } catch (ex) { supported += ", DOM sessionStorage: No"; }

  return supported;
}

function test_ie_userdata(){
  try {
    oPersistDiv.setAttribute("remember", "remember this value");
    oPersistDiv.save("oXMLStore");
    oPersistDiv.setAttribute("remember", "overwritten!");
    oPersistDiv.load("oXMLStore");
    if ("remember this value" == (oPersistDiv.getAttribute("remember"))) {
      return ", IE userData: Yes";
    } else { 
      return ", IE userData: No";
    }
  } catch (ex) {
      return ", IE userData: No";
  }
}

function test_open_database(){
  return ", openDatabase: " + (!!window.openDatabase);
}

function test_indexed_db(){
  try {
    return ", indexed db: " + (!!window.indexedDB);
  } catch (e) {
    return ", indexed db: true";
  }
}

function get_touch_support(touch_support){
  var touch_support_str = ""
  touch_support_str += "Max touchpoints: " + String(touch_support[0]);
  touch_support_str += "; TouchEvent supported: " + String(touch_support[1]);
  touch_support_str += "; onTouchStart supported: " + String(touch_support[2]);
  return touch_support_str;
}

var success = 0;
var retries = 20;

function retry_post() {
  retries = retries -1;
  if (success || retries == 0)
    return 0;
  // no luck yet
  fetch_client_whorls()
}

function fetch_client_whorls(){
  var callback = function(results){
    success = 1;
    json_results = JSON.parse(results);
    if(typeof trackerTest != 'undefined' && trackerTest){
      $('#fingerprintTable').html(json_results.markup);
      // the below is somewhat arbitrary.  we may want to have the result
      // determined by entropy rather than matches in the future
      // * note: if this logic changes, change in results-nojs route too.
      if(json_results.matching == 1){
        $('#fp_status').html(fp_status_str['no_unique']);
      } else if(json_results.matching <= 20){
        $('#fp_status').html(fp_status_str['no']);
      } else if(json_results.matching <= 100){
        $('#fp_status').html(fp_status_str['partial']);
      } else {
        $('#fp_status').html(fp_status_str['yes']);
      }
    } else {
      $('#content .content-background').html(json_results.markup);
    }
  };

  // fetch client-side vars
  var whorls_v1 = new Object();

  // this is a backup plan
  setTimeout("retry_post()",1100);

  console.time('plugins');
  try { 
    whorls_v1['plugins'] = identify_plugins();
  } catch(ex) { 
    whorls_v1['plugins'] = "permission denied";
  }
  console.timeEnd('plugins');

  // Do not catch exceptions here because the async Flash applet will raise
  // them until it is ready.  Instead, if Flash is present, the retry timeout
  // will cause us to try again until it returns something meaningful.
  console.time('timezone');
  try { 
    whorls_v1['timezone'] = new Date().getTimezoneOffset();
  } catch(ex) {
    whorls_v1['timezone'] = "permission denied";
  }
  console.timeEnd('timezone');

  console.time('video');
  try {
    whorls_v1['video'] = screen.width+"x"+screen.height+"x"+screen.colorDepth;
  } catch(ex) {
    whorls_v1['video'] = "permission denied";
  }
  console.timeEnd('video');
  
  console.time('language');
  whorls_v1['language'] = navigator.language;
  console.timeEnd('language');
  
  console.time('platform');
  whorls_v1['platform'] = navigator.platform;
  console.timeEnd('platform');

  let whorls_v2 = JSON.parse(JSON.stringify(whorls_v1));

 console.time('supercookies');
  whorls_v1['supercookies'] = test_dom_storage() + test_ie_userdata();
  console.timeEnd('supercookies');

  console.time('supercookies_v2');
  whorls_v2['supercookies_v2'] = test_dom_storage() + test_ie_userdata() + test_open_database() + test_indexed_db();
  console.timeEnd('supercookies_v2');
  
  console.time('cpu_class');
  whorls_v2['cpu_class'] = navigator.cpuClass || "N/A";
  console.timeEnd('cpu_class');
  
  console.time('hardware_concurrency');
  whorls_v2['hardware_concurrency'] = navigator.hardwareConcurrency || "N/A";
  console.timeEnd('hardware_concurrency');
  
  console.time('device_memory');
  whorls_v2['device_memory'] = navigator.deviceMemory || "N/A";
  console.timeEnd('device_memory');

  let post_idle_callback = function(components, components_second_run){
  
    let components_hash = {};
    let components_second_run_hash = {};

    for(component of components){
      components_hash[component.key] = component.value;
    }
    for(component of components_second_run){
      components_second_run_hash[component.key] = component.value;
    }

    console.time("canvas_hash_v2");
    try {
      let canvas_hash_v2_1 = Fingerprint2_new.x64hash128(JSON.stringify(components_hash['canvas']), 31);
      let canvas_hash_v2_2 = Fingerprint2_new.x64hash128(JSON.stringify(components_second_run_hash['canvas']), 31);
      if(canvas_hash_v2_1 == canvas_hash_v2_2){
        whorls_v2['canvas_hash_v2'] = canvas_hash_v2_1;
      } else {
        whorls_v2['canvas_hash_v2'] = "randomized";
      }
    } catch(ex) {
      whorls_v2['canvas_hash_v2'] = "undetermined";
    }
    console.timeEnd("canvas_hash_v2");

	console.time("webgl_hash_v2");
    try {
      let webgl_hash_v2_1 = Fingerprint2_new.x64hash128(JSON.stringify(components_hash['webgl']), 31);
      let webgl_hash_v2_2 = Fingerprint2_new.x64hash128(JSON.stringify(components_second_run_hash['webgl']), 31);
      if(webgl_hash_v2_1 == webgl_hash_v2_2){
        whorls_v2['webgl_hash_v2'] = webgl_hash_v2_1;
      } else {
        whorls_v2['webgl_hash_v2'] = "randomized";
      }
    } catch(ex) {
      whorls_v2['webgl_hash_v2'] = "undetermined";
    }
    console.timeEnd("webgl_hash_v2");

	console.time("touch_support_v2");
    whorls_v2['touch_support'] = get_touch_support(components_hash['touchSupport']);
    console.timeEnd("touch_support_v2");
    
    console.time('timezone2');
    whorls_v2['timezone_string'] = components_hash['timezone'];
    console.timeEnd('timezone2');
    
    console.time('adBlock');
    whorls_v2['ad_block'] = components_hash['adBlock'];
    console.timeEnd('adBlock');
    
    console.time('audio');
    whorls_v2['audio'] = components_hash['audio'];
    console.timeEnd('audio');
    
    console.time('webgl_vendor_renderer');
    whorls_v2['webgl_vendor_renderer'] = components_hash['webglVendorAndRenderer'];
    console.timeEnd('webgl_vendor_renderer');

    var fp = new Fingerprint2();

	console.time("canvas_hash");
    try{
      let canvas_hash_1 = fp.x64hash128(fp.getCanvasFp());
      let canvas_hash_2 = fp.x64hash128(fp.getCanvasFp());
      if(canvas_hash_1 == canvas_hash_2){
        whorls_v1['canvas_hash'] = canvas_hash_1;
      } else {
        whorls_v1['canvas_hash'] = "randomized";
      }
    } catch(ex) {
      whorls_v1['canvas_hash'] = "undetermined";
    }
    console.timeEnd("canvas_hash");

	console.time("webgl_hash");
    try{
      let webgl_hash_1 = fp.x64hash128(fp.getWebglFp());
      let webgl_hash_2 = fp.x64hash128(fp.getWebglFp());
      if(webgl_hash_1 == webgl_hash_2){
        whorls_v1['webgl_hash'] = webgl_hash_1;
      } else {
        whorls_v1['webgl_hash'] = "randomized";
      }
    } catch(ex) {
      whorls_v1['webgl_hash'] = "undetermined";
    }
    console.timeEnd("webgl_hash");
    
    console.time("touch_support");
    whorls_v1['touch_support'] = get_touch_support(fp.getTouchSupport());
    console.timeEnd("touch_support");

    fp.fontsKey([], function(fonts){
    console.time('fonts');
      whorls_v1['fonts'] = get_fonts(fonts[0]['value']);
      console.timeEnd('fonts');
      
      console.time('fonts_v2');
      whorls_v2['fonts_v2'] = get_fonts(components_hash['fonts']);
      console.timeEnd('fonts_v2');

      // send to server for logging / calculating
      // and fetch results

      $.post({
        url: "/ajax-fingerprint",
	data: JSON.stringify({v1: whorls_v1, v2: whorls_v2}),
        contentType: 'application/json',
        success: callback,
        dataType: "html"
      });
    });
  }

  let fp2_get_components = function(){
    Fingerprint2_new.get(function(components){
      Fingerprint2_new.get(function(components_second_run){
        post_idle_callback(components, components_second_run);
      });
    });
  };

  if (window.requestIdleCallback) {
    requestIdleCallback(fp2_get_components);
  } else {
    setTimeout(fp2_get_components, 500);
  }

};


set_dom_storage();

$(document).ready(function(){
  // wait some time for the flash font detection:
  setTimeout("fetch_client_whorls()",1000);
});
