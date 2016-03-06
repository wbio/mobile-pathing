var currPageId,
	currPageName,
	currFlowName,
	newPageMode = false;

$(window).load(function(){
	var containerHeight = $('#mid-container').height();
	$('#mid-container').css({
	    'width': containerHeight + 'px'
	});


});

$( window ).resize(function() {
	var containerHeight = $('#mid-container').height();
	$('#mid-container').css({
	    'width': containerHeight + 'px'
	});
});

function getPages(callback){
	$.ajax({
		type: 'GET',
		url: '/pages',
		dataType: 'json',
		success: function(msg) {},
		error: function(err) {}
    }).done(function(response) {
		if (response.msg === '') {
		}
		else {
		}
		callback(response);
    });
}

function getFlows(callback){
	$.ajax({
		type: 'GET',
		url: '/flows',
		dataType: 'json',
		success: function(msg) {},
		error: function(err) {}
    }).done(function(response) {
		if (response.msg === '') {
		}
		else {
		}
		callback(response);
    });
}

function loadPage(id, transition){
	if(id != 'new'){
		newPageMode = false;
		$.ajax({
			type: 'GET',
			url: '/pages/' + id,
			dataType: 'json',
			success: function(msg) {},
			error: function(err) {}
	    }).done(function(response) {
			currPageId = id;
			// Set the page name
			currPageName = response.pageName;
			$('#page-name').text(currPageName);
			$('#page-name-sp').text(currPageName);

			var imageSrc;
			if(response.image){
				imageSrc = 'data:' + response.image.type + ';base64,' + response.image.image
			}
			// Set the image
			if(transition == 'slide_right'){ transitionSlideFromRight(imageSrc); }
			else if(transition == 'slide_left'){ transitionSlideFromLeft(imageSrc); }
			else if(transition == 'slide_bottom'){ transitionSlideFromBottom(imageSrc); }
			else if(transition == 'slide_top'){ transitionSlideFromTop(imageSrc); }
			else if(transition == 'appear'){ transitionAppearInstantly(imageSrc); }
			else if(transition == 'scrolltop_appear'){ transitionScrollTopAppearInstantly(imageSrc); }
			else if(transition == 'slidecurr_left'){ transitionSlideCurrentScreenLeft(imageSrc); }
			else if(transition == 'slidecurr_right'){ transitionSlideCurrentScreenRight(imageSrc); }
			else if(transition == 'slidecurr_up'){ transitionSlideCurrentScreenUp(imageSrc); }
			else if(transition == 'slidecurr_down'){ transitionSlideCurrentScreenDown(imageSrc); }
			else{ transitionSlideFromBottom(imageSrc); }
			// Overlay the links
			$('#links > .link').remove();
			$('#popup-menu').hide();
			if(response.hasOwnProperty('links')){
				for(var i=0; i<response.links.length; i++){
					var link = response.links[i];
					var linkElem = $('<div/>', {
			            'class': 'link',
			            style:  'top: ' + link.coordinates.y + '; left:' + link.coordinates.x + '; width:' + link.coordinates.width + '; height:' + link.coordinates.height + ';',
			            onclick: 'selectLink(this);',
			            'val-targetId': link.target,
			            'val-transition': link.transition
			        	});
					var linkInfo = getPageInfoByLink(linkElem);
					if(linkInfo != null && linkInfo.pageId != 'new'){
						$(linkElem).addClass('complete');
					}
					$(linkElem).appendTo('#links');
				}
			}
			// Set the current flow name, if applicable
			$('#save-flow').addClass('disabled');
			if(response.hasOwnProperty('flow')){
				currFlowName = response.flow;
				$('#flow-name-sp').text(currFlowName);
				$('#delete-flow').removeClass('disabled');
			}else{
				currFlowName = null;
				$('#flow-name-sp').text('');
				$('#delete-flow').addClass('disabled');
				$('#save-flow').addClass('disabled');
			}
			// Set the form values for the Image modification
			if(currPageId != null){
				$('#image-form').attr('action', '/pages/images/' + currPageId);
				$('#image-form').attr('method', 'post');
			}else{
				$('#image-form').attr('action', '/pages/images');
				$('#image-form').attr('method', 'post');
			}

			// Hide the current page from the navigation
			$('.page-obj, .jump-page-obj').removeClass('noshow');
			var selector = '.page-obj[val-id="' + currPageId + '"], .jump-page-obj[val-id="' + currPageId + '"]';
			$(selector).addClass('noshow');

			// Hide the current flow from the navigation
			$('.jump-flow').removeClass('noshow');
			var selector = '.jump-flow[val-id="' + currPageId + '"]';
			$(selector).addClass('noshow');
	    });
	}else{
		alert('Page not added yet - use the Link Editor to specify a page');
	}
}

function getPageInfoByLink(elem){
	var targetId = $(elem).attr('val-targetId')
	if(targetId){
		var selector = '.page-obj[val-id="' + targetId + '"]',
			pageElem = $(selector);
		if(pageElem.length > 0){
			var returnVar = {
				pageName: $(pageElem).text(),
				pageId: $(pageElem).attr('val-id')
			};
			return returnVar;
		}
	}
	return null;
}

function transitionSlideFromLeft(img){
	$('#foreground').css({ left: '-100%', top: $('#page-inner-container').scrollTop() + 'px' });
	$('#foreground-img').attr('src', img);
	$('#foreground').stop().animate({
    	left: '0%'
    },{ duration:200, queue:false, complete: function(){
    	$('#background-img').attr('src', img);
    	$('#foreground').css({ top: 0 });
    	$('#page-inner-container').scrollTop(0);
    } });
}

function transitionSlideFromRight(img){
	$('#foreground').css({ left: '100%', top: $('#page-inner-container').scrollTop() + 'px' });
	$('#foreground-img').attr('src', img);
	$('#foreground').stop().animate({
    	left: '0%'
    },{ duration:200, queue:false, complete: function(){
    	$('#background-img').attr('src', img);
    	$('#foreground').css({ top: 0 });
    	$('#page-inner-container').scrollTop(0);
    } });
}

function transitionSlideFromBottom(img){
	$('#foreground').css({ top: '100%'});
	$('#foreground-img').attr('src', img);
	$('#foreground').stop().animate({
    	top: $('#page-inner-container').scrollTop() + 'px'
    },{ duration:200, queue:false, complete: function(){
    	$('#background-img').attr('src', img);
		$('#foreground').css({ top: '0'});
		$('#page-inner-container').scrollTop(0);
    } });
}

function transitionSlideFromTop(img){
	$('#foreground').css({ top: '-100%'});
	$('#foreground-img').attr('src', img);
	$('#foreground').stop().animate({
    	top: '0%'
    },{ duration:200, queue:false, complete: function(){
    	$('#background-img').attr('src', img);
    } });
}

function transitionAppearInstantly(img){
	$('#foreground-img').attr('src', img);
	$('#background-img').attr('src', img);
}

function transitionScrollTopAppearInstantly(img){
	var dur = 0;
	if($('#page-inner-container').scrollTop() > 0){
		dur = 200;
	}
	$('#page-inner-container').animate({ 
		scrollTop: 0 
	},{ duration:dur, queue:true, complete: function(){
    	$('#foreground-img').attr('src', img);
		$('#background-img').attr('src', img);
    } });
}

function transitionSlideCurrentScreenDown(img){
    $('#background-img').attr('src', img);
    $('#background').css({ top: $('#page-inner-container').scrollTop() + 'px'});
	$('#foreground').stop().animate({
    	top: '100%'
    },{ duration:200, queue:false, complete: function(){
		$('#foreground-img').attr('src', img);
		$('#foreground').css({ top: '0'});
		$('#page-inner-container').scrollTop(0);
    } });
}

function transitionSlideCurrentScreenUp(img){
    $('#background-img').attr('src', img);
	$('#foreground').stop().animate({
    	top: '-100%'
    },{ duration:200, queue:false, complete: function(){
		$('#foreground-img').attr('src', img);
		$('#foreground').css({ top: '0'});
    } });
}

function transitionSlideCurrentScreenLeft(img){
    $('#background-img').attr('src', img);
    $('#background').css({ top: $('#page-inner-container').scrollTop() + 'px'});
	$('#foreground').stop().animate({
    	left: '-100%'
    },{ duration:200, queue:false, complete: function(){
		$('#foreground-img').attr('src', img);
		$('#foreground').css({ left: '0', top: '0' });
    } });
}

function transitionSlideCurrentScreenRight(img){
    $('#background-img').attr('src', img);
    $('#background').css({ top: $('#page-inner-container').scrollTop() + 'px'});
	$('#foreground').stop().animate({
    	left: '100%'
    },{ duration:200, queue:false, complete: function(){
		$('#foreground-img').attr('src', img);
		$('#foreground').css({ left: '0', top: '0'});
    } });
}

function jumpToPage(elem){
	if(elem != null){
		$('.header-dropdown').slideUp(200);
		$('.header-section').removeClass('upside');
		var pageId = $(elem).attr('val-id');
		loadPage(pageId, null);
	}
}