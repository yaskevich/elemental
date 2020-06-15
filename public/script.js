$(function() {   // Handler for .ready() called.
$("title").text("Elemental – Smart Annotation tool");
$(".single-mode").prop('checked', true); 

// $(".modus").html($(".single-mode").prop('checked')?"single": "multi");
    
    function procMode() {
        var mode = $('input[name="mode"]:not(:checked)').val();
        // console.log("dis", mode);
        $('.'+mode).addClass("d-none");
        $('.'+$('input[name="mode"]:checked').val()).removeClass("d-none");
    }
    procMode();


 // Generate dom elements
const boxes = [
    // ['.box-wrap.boxes.red', 252],
    // ['.box-wrap.boxes.blue', 42],
    ['.box-wrap.boxes.green', 4]
];

// for (const [sel, items] of boxes) {
    // const container = document.querySelector(sel);

    // for (let i = 0; i < items; i++) {
        // console.log("11");
        // container.appendChild(
            // document.createElement('div')
        // );
    // }
// }

function reverse(str){
  return str.split("").reverse().join("");
}

$.getJSON( "/api/data", function( data ) {
     // { id: 2933, token: "i", meta: "", qty: 0, lemmas: 1 }
    
        // let dd = [];
    // for (let x in data) {
        // // console.log(data[x]["token"]);
        // dd.push(data[x]["token"]);
    // }
    
    data = data.sort(function(a, b){
        if(reverse(a.token) < reverse(b.token)) { return -1; }
        if(reverse(a.token) > reverse(b.token)) { return 1; }
        return 0;
    });
    // data = data.sort(function(a, b){
        // if(a.token < b.token) { return -1; }
        // if(a.token > b.token) { return 1; }
        // return 0;
    // });
    
    $.each( data, function( key, val ) {
        $('.box-wrap.boxes.green').append('<div class="row" data-id="'+val["id"]+'" data-token="'+val["token"]+'">'+ val["token"]+'</div>')
    });
});


// Initialize selectionjs
const selection = Selection.create({

    // Class for the selection-area
    class: 'selection',

    // All elements in this container can be selected
    selectables: ['.box-wrap > div'],

    // The container is also the boundary in this case
    boundaries: ['.box-wrap']
}).on('start', ({inst, selected, oe}) => {

    // Remove class if the user isn't pressing the control key or ⌘ key
    if (!oe.ctrlKey && !oe.metaKey) {

        // Unselect all elements
        for (const el of selected) {
            el.classList.remove('selected');
            inst.removeFromSelection(el);
        }

        // Clear previous selection
        inst.clearSelection();
    }

}).on('move', ({changed: {removed, added}}) => {

    // Add a custom class to the elements that where selected.
    for (const el of added) {
        el.classList.add('selected');
    }

    // Remove the class from elements that where removed
    // since the last selection
    for (const el of removed) {
        el.classList.remove('selected');
    }

}).on('stop', ({inst}) => {
    inst.keepSelection();
});





var quickPos = '';

// var basePos = {
	// 'vb': ["дзеяслоў", 'd'],
	// 'vi': ["інфінітыў", ''],
	// 'vg': ["дзеепрыслоўе", ''],
	// 'nn': ["назоўнік", 'f'],
	// 'np': ["імя ўласнае", 'p'],
	// 'nb': ["не беларускае", 'b'],
	// 'nw': ["не слова", ''],
	// 'part': ["часціца", ''],
	// 'nm': ["лічэбнік", 'xx'],
	// 'aj': ["прыметнік", 's'],
    // 'va': ["дзеепрыметнік", ''],
	// 'av': ["прыслоўе", 'a'],
	// 'pn': ["займеннік", 'z'],
	// 'pp': ["прыназоўнік", 'v'],
	// 'cj': ["злучнік", 'c'],
	// 'intj': ["выклічнік", 'c'],
	// 'det': ["вызначальнік", ''],
	// 'aux': ["дапаможнік", ''],
	// 'prad': ["займ. прысл", ''],
	// // 'dm': ["дыс. маркер", ''],
	// 'mod': ["мадыфікатар", ''],
	// 'ip': ["!?..", ''],
	// // 'sm': ["іншае", 'q']
// };
var basePos = {
	'vb': ["finite verb", 'd'],
	'vi': ["infinitive", ''],
	'vg': ["adv. participle", ''],
	'nn': ["noun", 'f'],
	'np': ["proper", 'p'],
	'nb': ["non Bel.", 'b'],
	'nw': ["nonword", ''],
	'part': ["particle", ''],
	'nm': ["numeral", 'xx'],
	'aj': ["adjective", 's'],
    'va': ["participle", ''],
	'av': ["adverb", 'a'],
	'pn': ["pronoun", 'z'],
	'pp': ["preposition", 'v'],
	'cj': ["conjunction", 'c'],
	'intj': ["interjection", 'c'],
	'det': ["determiner", ''],
	'aux': ["auxiliary", ''],
	'prad': ["pronom. adv.", ''],
	// 'dm': ["дыс. маркер", ''],
	'mod': ["modifier", ''],
	'ip': ["!?..", ''],
	// 'sm': ["іншае", 'q']
};
// var hotKeys = {'d':'vb', 's': 'aj', 'z': 'pn', 'c':'cj',  'a':'av', 'x':'nm', 'f':'nn'}
// var kiz = basePos.map((x) => ([x[2]]:x[0]));
// var hotKeys = basePos.reduce(function(m, obj) {
    // m[obj[2]] = obj[0];
    // return m;
// }, {});
// Object.entries

var hotKeys = Object.entries(basePos).map(x=> ({[x[1][1]]:x[0]})).reduce(function(y, z) {
	let v = Object.keys(z)[0];
	y[v] = z[v];
    return y;
}, {});


// var specClasses;
// $.getJSON( "classes.json", function( data ) {
	// specClasses  = data;
	// // console.log(data);
// });

// $('.magicPos').prepend(Object.entries(basePos).map(x => 		
	// '<div style="margin-bottom:3px;"><button class="btn mgclick" data-pos="'+ x[0] +'">'+x[1][0]+'</b></div>'
// ).join(''));

$('.toolbar').append(Object.entries(basePos).map(x => 		
	'<button class="btn mgclick '+x[0]+'" data-pos="'+ x[0] +'">'+x[1][0]+'</b>'
).join(''));

function makeRadio(group, val, title){
	return '<label class="form-radio">'+
	'<input name="'+group+'" type="radio" value="'+val+'">' +
	'<i class="form-icon"></i> <span class="'+val+'">'+title+'</span>' +
	'</label>';
}

var boardPos = Object.entries(basePos).map(x=> makeRadio('genpos', x[0], x[1][0])).join('');
$('.board').prepend(boardPos);

var classes = Object.keys(basePos).join(" ");
                               
function setWordClass(wClass){
	if (wClass){
		var sel  = $(".processed");
		// sel.removeClass('vb aj pn cj av nm nn').addClass(wClass.toLowerCase());
		var tid  = sel.data('tid');
		var uid  = sel.data('unit');
		var sid  = sel.data('id');
        
        var singleMode = $('.single-mode').prop('checked');
        
        console.log("setting class", wClass);
        

        
        
		$.post( "/api/tokens", { "id": tid, "mode": singleMode|0, "sid": sid, "uid": uid|0, "cls": wClass}, function( data ) {
			// console.log( "Data Loaded: " + data );
			console.log( "token was successfully changed", data);
            
            if(singleMode){ // tag only this token!
                console.log("only single unit!");
                sel.removeClass(classes).addClass(wClass+ " tagged");
            } else { // tag every token of the same shape
                console.log("for every repr of the token", tid, data.id);
                $('.editfield').children('a').each(function (i) {
                    if ($(this).data('tid') === tid){
                        $(this).data("unit", data.id);
                        $(this).removeClass(classes).addClass(wClass+ " tagged");
                    }			
                });
            }
            sel.removeClass("processed");            
            

		}).fail(function(response) {
			// console.log('Error: ' + response.responseText);
			console.log("fail", response.status);
		});
	}
	
}
	
    
function processClassChange(evt){
   if ( evt.which == 13 ) {
     evt.preventDefault();
  }
  console.log( evt.key );

  if (hotKeys.hasOwnProperty(evt.key)){
	  setWordClass(hotKeys[evt.key]);
  } 
}   
 
$( "#modal" ).keypress(function( event ) {
  if ( event.which == 13 ) {
     event.preventDefault();
  }
  console.log( event.key );

  if (hotKeys.hasOwnProperty(event.key)){
	  setWordClass(hotKeys[event.key]);
      $('#modal').iziModal('close');
  }
});
 
 var tokens = {};

$.getJSON( "/api/texts", function( data ) {
  var items = [];
  let previous = 0;
  
  var ok = true;
  var curSent = 0;
  var sentItems = [];
  $.each( data, function( key, val ) {
	  // console.log(val);
	  // items.push( "<div>"+val.map(x=> x.map(z=> (console.log(z), JSON.stringify(z))))+"</div>" );
	  // words =  words.map(x => '<a class="token '+(x.trim().match(/[\s\n\r.,:\"\+!?-]+/)?'btn punct':'btn')+'">'+x+'</a>');
	  if (previous !== val.p){
		  sentItems.push( '<div></div>' );
		  previous = val.p;
	  }
      // console.log(curSent, val.s);
      
        if ((val.s !== curSent)){
            // console.log(curSent, ok);
            
            // if(!ok){
            if(true) {
            // if(!ok){
                // console.log(curSent, "push");
                $.merge( items, sentItems);
                ok = true;
            }
            sentItems = [];
            curSent = val.s;
        }       
      
		// if (val.cl !== 'ip' || val.t=='-' || val.t=='–' ) {
		if (val.cl !== 'ip' || val.t == '-' || val.t == '–'|| val.t == '—') {
            sentItems.push( '<a class="'+ (val.cl? val.cl + ' tagged':'') + ' token btn btn-sm"' + ' data-token="'+val.utoken+'" data-unit="'+(val.uid||'') + '" data-id="'+val.sid +'"  data-tid="'+val.tid+'">' + val.v+'</a>' );
            if (!val.cl){
                ok = false;
            }
            
            if (tokens.hasOwnProperty(val.utoken)){
                tokens[val.utoken] +=1;
            } else {
                tokens[val.utoken] =1;
            }
		}
	
	// if (val.s === 50) { return false; }
  });
             if(!ok){
                // console.log(curSent, "push");
                $.merge( items, sentItems);
                ok = true;
            }
 $('.editfield').append(items);
  // $( "<ul/>", {
    // "class": "my-new-list",
    // html: items.join( "" )
  // }).appendTo( "body" );
});


$('input[name="mode"]').click(function() {
    // console.log("bebe");
    procMode();
  });
	
$("#modal").iziModal({
    // history: true,
    // title: "Марфалагічны аналіз",
    // subtitle: "Simple, complete and lightweight modal plugin with jquery.",
    icon: 'icon-chat',
    // overlayColor: 'rgba(255, 255, 255, 0.4)',
    // headerColor: '#334c7b',
    iconColor: 'white',
    // fullscreen: true,
    // width: 700,
    padding: 20,
    // rtl: true,
    // bodyOverflow: true,
    // closeButton: false,
    // top: 50,
    // bottom: 50,
    onClosed: function(modal){
        // console.info(modal)
			$(".processed").toggleClass("processed");
        //modal.destroy();
    },
    onOpening: function(modal){
        // modal.startLoading();
    },
    onOpened: function(modal){
        // modal.stopLoading();
        setTimeout(function(){
            $("#modal-large .iziModal-wrap").scrollTop(0);            
        },1)
    }
});

$('body')
.on('click', '.conll', function(e) {
	
	jQuery.get('/conll', function(data) {
		var fn = "kolas-uph.conll";
		var file = new Blob([data], {
			type: 'application/octet-stream',
			name: fn
		});
		saveAs(file, fn);
	});
	
})
.on('click', 'a.token', function(e) {
			var txt = $(e.target).data("token");
            var tid  = $(e.target).data('tid');
            $('.processed').removeClass('processed');
            $(e.target).addClass("processed");
            $('.inform').html(txt+" "+tokens[txt]);
            // console.log($(e.target).data("unit"));
            
            
            
            if (quickPos) {
                setWordClass(quickPos);
            } else {
                $('.editfield').children('a').each(function (i) {
                    if ($(this).data('tid') === tid){
                        $(this).addClass("processed");
                    }			
                });
            }
            
			// $('#modal').iziModal('setTitle', txt);
			// $('#modal').iziModal('open');			 
			// console.log("open modal");
}).keypress(function( event ) {
  // processClassChange(event);
}).on('click', '.mgclick', function(e) {
    var newpos = $(this).data("pos");
    // console.log("mode!", newpos);
    var mode = $('input[name="mode"]:checked').val();
    console.log("GLOBAL", mode);
    $('.processed').removeClass('processed');
    
    if (mode === "moz") {
        if (quickPos && quickPos === newpos){
            quickPos = '';
            $("title").text("Elemental – Smart Annotation tool")
            console.log("disable quick mode");
        } else {
            $("title").text(basePos[newpos][0]);
            quickPos = newpos;
            console.log("QUICK", newpos);
        }
    } else {
        
        // non-mozaic - list mode
        $('.row.selected').each(function(){
            var that = $(this);            
            console.log(that.data("id"), that.data("token"), "→", newpos);
            $.post( "/api/tokens", { "id": that.data("id"), "props": newpos}, function( data ) {
                // console.log( "Data Loaded: " + data );
                console.log( "token was successfully changed");
                that.remove();
            }).fail(function(response) {
                // console.log('Error: ' + response.responseText);
                console.log(response.status);
            });            
        });        
    }
})

;
 $('.pos2').on('click',function(e){
     var curClass = $('input[name=genpos]:checked').val();
     var subClasses = [];
     var boardClasses;
     $.each(specClasses, function (i, obj) {
         // console.log(obj);
         if (obj.pos === curClass){
                subClasses.push(obj);					
         }			 
     });
     console.log(subClasses);
     if (subClasses.length>1){
         var boardPos = subClasses.map(x=> makeRadio('specclass', x['class'], x['desc']+' <i>'+x['ex']+'</i>')).join('');
        $('.board').html(boardPos);
     }
    // setClassAndClose($('input[name=genpos]:checked').val());
 });
	 
	// let stop = /(?=[\s\n\r.,:\"\+!?-]+)/;
	// var words = alltext.split(stop);
	// words =  words.map(x => '<a class="token '+(x.trim().match(/[\s\n\r.,:\"\+!?-]+/)?'btn punct':'btn')+'">'+x+'</a>');
	 // console.log(words);
	 // $('.editfield').append(words);
});