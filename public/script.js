$(function() {   // Handler for .ready() called.

var basePos = {
	'vb': ["дзеяслоў", 'd'],
	'nn': ["назоўнік", 'f'],
	'nm': ["лічэбнік", 'x'],
	'aj': ["прыметнік", 's'],
	'av': ["прыслоўе", 'a'],
	'pn': ["займеннік", 'z'],
	'pp': ["прыназоўнік", 'v'],
	'cj': ["злучнік", 'c'],
	'sm': ["іншае", 'q']
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


var specClasses;
$.getJSON( "classes.json", function( data ) {
	specClasses  = data;
	// console.log(data);
});

$('.magicPos').prepend(Object.entries(basePos).map(x => 		
	'<div style="margin-bottom:3px;"><button class="btn mgclick" data-pos="'+ x[0] +'">'+x[1][0]+'</b></div>'
).join(''));

function makeRadio(group, val, title){
	return '<label class="form-radio">'+
	'<input name="'+group+'" type="radio" value="'+val+'">' +
	'<i class="form-icon"></i> <span class="'+val+'">'+title+'</span>' +
	'</label>';
}

var boardPos = Object.entries(basePos).map(x=> makeRadio('genpos', x[0], x[1][0])).join('');
$('.board').prepend(boardPos);


function setClassAndClose(wClass){
	if (wClass){
		var sel  = $(".processed");
		// sel.removeClass('vb aj pn cj av nm nn').addClass(wClass.toLowerCase());
		var tid  = sel.data('tid');
		$('.editfield').children('a').each(function (i) {
			if ($(this).data('tid') === tid){
				$(this).removeClass('vb aj pn cj av nm nn').addClass(wClass);
				// console.log(i);
			}			
		});
		$.post( "/api/tokens", { "id": tid, "props": wClass}, function( data ) {
			// console.log( "Data Loaded: " + data );
			console.log( "token was successfully changed");
			

		}).fail(function(response) {
			// console.log('Error: ' + response.responseText);
			console.log(response.status);
		});
	}
	$('#modal').iziModal('close');
}
	
$( "#modal" ).keypress(function( event ) {
  if ( event.which == 13 ) {
     event.preventDefault();
  }
  console.log( event.key );

  if (hotKeys.hasOwnProperty(event.key)){
	  setClassAndClose(hotKeys[event.key]);
  }
});
 

$.getJSON( "/api/texts", function( data ) {
  var items = [];
  let previous = 0;
  $.each( data, function( key, val ) {
	  // console.log(val);
	  // items.push( "<div>"+val.map(x=> x.map(z=> (console.log(z), JSON.stringify(z))))+"</div>" );
	  // words =  words.map(x => '<a class="token '+(x.trim().match(/[\s\n\r.,:\"\+!?-]+/)?'btn punct':'btn')+'">'+x+'</a>');
	  if (previous !== val.p){
		  items.push( '<div></div>' );
		  previous = val.p;
	  }
		if (val.cl !== 'ip' || val.t=='-') {
			items.push( '<a class="token btn btn-sm '+ val.cl + ' "data-token="'+val.t+'" data-tid="'+val.tid+'">' + val.v+'</a>' );
		}
	
	if (val.p === 50) {
		return false;
	}
  });
 
 $('.editfield').append(items);
  // $( "<ul/>", {
    // "class": "my-new-list",
    // html: items.join( "" )
  // }).appendTo( "body" );
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

$('body').on('click', 'a.token', function(e) {
			var txt = $(e.target).data("token");
			$(e.target).toggleClass("processed");
			$('#modal').iziModal('setTitle', txt);
			$('#modal').iziModal('open');			 
			console.log("open modal");
     });	
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