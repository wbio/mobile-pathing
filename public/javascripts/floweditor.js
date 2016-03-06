var editingLinks = false,
	drawingLinks = false,
	unsavedLinkEdit = false,
	popupMenuReferencing = null,
	dragStartInRange = false,
	targetPageExisted = false,
	isRedrawing = false,
	saveLinkDisabled = true,
	linkBeingRedrawn = null,
	linkInitialState = null,
	pageNameChanged = false
	prevPageName = null,
	linksSaveState = null,
	linksEdited = false,
	linksDrawn = false
	linksRemoved = false,
	noImage = false;

var hideLinksStyle = $('<style>.link { opacity: 0; }</style>');


/*************************************************************************************************************/
/*************************************************************************************************************/
/********************************************** Bound Functions **********************************************/
/*************************************************************************************************************/
/*************************************************************************************************************/

$(document).ready(function(){


/********************************************** Populating the Page **********************************************/

	getPages(function(response){
		for(var i=0; i<response.length; i++){
			var jumpPageObj = $('<div/>', {
	            'class': 'jump-page-obj',
	            'text': response[i].pageName,
	            'val-id': response[i]._id,
	            'onclick': 'jumpToPage(this)'
	        	});
			$(jumpPageObj).appendTo('#jump-page-dropdown');
			var linkPageObj = $('<div/>', {
	            'class': 'page-obj',
	            'text': response[i].pageName,
	            'val-id': response[i]._id
	        	});
			$(linkPageObj).appendTo('#other-pages');
		}
		$('.page-obj').bind({
			dragstart: function(event){ pageDragStart(event); },
			drag: function(event){ pageDrag(event); },
			dragend: function(event){ pageDragEnd(event); }
		});
		calcPagesPosition();
	});

	getFlows(function(response){
		for(var i=0; i<response.length; i++){
			if(response[i].hasOwnProperty('flow')){
				var jumpFlowObj = $('<span/>', {
					'class': 'jump-flow',
					'text': response[i].flow,
					'val-id': response[i]._id,
	            	'onclick': 'jumpToPage(this)'
				});
				$(jumpFlowObj).appendTo('#jump-flows');
			}
		}
	});


	$("#image-form").submit(function(e){
		//e.preventDefault();
		//readImage(this[1]);
		var formData = new FormData($(this)[0]);
		var apiMethod,
			apiUrl;

		if(currPageId != null && currPageId != ''){
			apiMethod = 'PUT';
			apiUrl = '/pages/images/' + currPageId;
		}else{
			apiMethod = 'POST';
			apiUrl = '/pages/images';
		}

	    $.ajax({
	        url: apiUrl,
	       	type: apiMethod,
	        data: formData,
	        async: true,
	        success: function (response) {
	            var imageSrc = 'data:' + response.image.type + ';base64,' + response.image.image;
	            transitionSlideFromBottom(imageSrc);
	            if(currPageId == null || currPageId == ''){
	            	currPageId = response.id;
	            	noImage = false;
	            }
            	$('.header-dropdown').slideUp(200);
				$('.header-section').removeClass('upside');
	        },
	        cache: false,
	        contentType: false,
	        processData: false
	    });

	    return false;
	});


/********************************************** Link Drawing **********************************************/

	$( '#links')
		.drag("start", function( ev, dd ){
			if((drawingLinks || isRedrawing) && $(event.target).closest('#page-container').length){
				dragStartInRange = true;
				$('#links').addClass('noclick');
	            return $('<div class="selection" />').appendTo( '#page-container');
            }else{
            	dragStartInRange = false;
            }
        }, {distance:10})

		.drag(function( ev, dd ){
			if((drawingLinks || isRedrawing) && $(event.target).closest('#page-container').length){
				var pageContainerX = $('#page-container').position().left,
					pageContainerOffset = $('#page-container').offset().top,
					imageY = $('#foreground').position().top,
					midContainerX = $('#mid-container').offset().left,
					startX = dd.startX - pageContainerX - midContainerX,
					startY = dd.startY - pageContainerOffset,
					pageX = ev.pageX - pageContainerX - midContainerX,
					endX = startX + dd.offsetX - pageContainerX - midContainerX,
					endY = startY + dd.deltaY;
				$( dd.proxy ).css({
					top: Math.min( startY, endY ),
					left: Math.min( pageX, startX ),
					height: Math.abs( dd.deltaY ),
					width: Math.abs( dd.deltaX )
				});
			}
		})

		.drag("end",function( ev, dd ){
			if((drawingLinks || isRedrawing) && $(ev.target).closest('#page-container').length && dragStartInRange){
				var pageContainerX = $('#page-container').position().left,
					pageContainerOffset = $('#page-container').offset().top,
					imageY = $('#foreground').position().top,
					midContainerX = $('#mid-container').offset().left,
					startX = dd.startX - pageContainerX - midContainerX,
					startY = (dd.startY- pageContainerOffset) + (-1*imageY),
					endX = startX + dd.offsetX - pageContainerX - midContainerX,
					endY = startY + dd.deltaY;
	            var minX, maxX, minY, maxY;
	            if(startX <= endX){ 
	                minX = startX; 
	                maxX = endX;
	            }else{
	                minX = endX;
	                maxX = startX;
	            }
	            if(startY <= endY){ 
	                minY = startY; 
	                maxY = endY;
	            }else{
	                minY = endY;
	                maxY = startY;
	            }
	            var bgWidth = $('#foreground-img').width(),
	            	bgHeight = $('#foreground-img').height(),
	            	valLeft = (minX / bgWidth) * 100, 
	            	valTop = (minY / bgHeight) * 100, 
	            	valWidth = (Math.abs(dd.deltaX) / bgWidth) * 100, 
	            	valHeight = (Math.abs(dd.deltaY) / bgHeight) * 100;
	            var newLink = $('<div/>', {
		            'class': 'link',
		            style:  'top: ' + valTop + '%; left:' + valLeft + '%; width:' + valWidth + '%; height:' + valHeight + '%;',
		            onclick: 'selectLink(this);',
		            'val-targetId': 'new',
		            'val-transition': 'default'
		        	});
	            popupMenuReferencing = newLink;
		        $(newLink).appendTo('#links');
	            selectLinkElem(newLink);
	        	$( dd.proxy ).remove();
	        	linksDrawn = true;
	        	if(isRedrawing){
	        		// Give the newly-drawn link all of the old link's properties
	        		$(newLink).attr('val-targetName', $(linkBeingRedrawn).attr('val-targetName'));
	        		$(newLink).attr('val-targetId', $(linkBeingRedrawn).attr('val-targetId'));
	        		$(newLink).attr('val-transition', $(linkBeingRedrawn).attr('val-transition'));
	        		if($(linkBeingRedrawn).hasClass('complete')){
	        			$(newLink).addClass('complete');
	        		}
	        		// Remove the old link and set everything back to normal
	        		$(linkBeingRedrawn).remove();
	        		redrawLink($('#redraw-link'));
	        		enableSaveLinkButton();
	        	}
			}else if(dragStartInRange){
	        	$( dd.proxy ).remove();
	        	$('#links').removeClass('noclick');
	        }
		});




/********************************************** Page Name Editor **********************************************/

	document.getElementById('page-name-sp').addEventListener("input", function() {
	    if($('#page-name-sp').text() != currPageName){
        	$('#save-name').removeClass('disabled');
        }else{
        	$('#save-name').addClass('disabled');
        }
	}, false);

	$('#page-name-sp').focus(function(){
		$('#save-name, #cancel-name').stop().animate({
        	opacity: 1
        },{ duration:200, queue:false });
        if($('#page-name-sp').text() == currPageName){
        	$('#save-name').addClass('disabled');
        }else{
        	$('#save-name').removeClass('disabled');
        }
        $('#cancel-name').removeClass('disabled');
	});

	$('#page-name-sp').blur(function(){
		$('#cancel-name').stop().animate({
        	opacity: 0
        },{ duration:200, queue:false });
        $('#cancel-name').addClass('disabled');
        if($('#page-name-sp').text() == currPageName){
        	$('#save-name').addClass('disabled');
        	$('#save-name').stop().animate({
	        	opacity: 0
	        },{ duration:200, queue:false });
        }
	});

	$('#save-name').click(function(){
		if(!$(this).hasClass('disabled')){
		    currPageName = $('#page-name-sp').text();
			var dataObj = {
				pageName: currPageName
			}
			var dataStr = JSON.stringify(dataObj);
			var apiUrl,
				apiMethod;
			if(currPageId != null && currPageId != ''){
				apiUrl = '/pages/names/' + currPageId;
				apiMethod = 'PUT';
			}else{
				apiUrl = '/pages/names';
				apiMethod = 'POST';
			}
			$.ajax({
				type: apiMethod,
				url: apiUrl,
				data: dataStr,
				contentType: 'application/json',
				success: function(msg) {},
				error: function(err) {}
		    }).done(function(response) {
		    	var existingPage = true;
		    	if(currPageId == null || currPageId == ''){
		    		currPageId = response.id;
		    		existingPage = false;
		    	}
		    	updatePageObjects(currPageName, existingPage);
		    	$('#save-name').addClass('disabled');
	        	$('#save-name').stop().animate({
		        	opacity: 0
		        },{ duration:200, queue:false });
		        var saveMsg = $('<div/>', {
		            text: 'Saved'
		        	});
		        $(saveMsg).css({
		        	'opacity': 0,
		        	'position': 'absolute',
		        	'color': '#333',
					'font-size': '12px',
					'text-align': 'center',
		        	'width': $('#save-name').outerWidth() + 'px',
		        	'height': $('#save-name').outerHeight() + 'px',
		        	'line-height': $('#save-name').outerHeight() + 'px',
		        	'left': $('#save-name').offset().left + 'px',
		        	'top': $('#save-name').offset().top + 'px'
		        });
		        $(saveMsg).appendTo('#header');
		        $(saveMsg).animate({ opacity: 1 }, 400)
		        	.delay(1400)
		        	.animate({ opacity: 0 }, { duration:400, complete: function(){
		        		$(saveMsg).remove();
		        	}
		    	});
		    });
		}
	});

	$('#cancel-name').click(function(){
		$('#page-name-sp').text(currPageName);
		$('#save-name').addClass('disabled');
    	$('#save-name').stop().animate({
        	opacity: 0
        },{ duration:200, queue:false });
	});




/********************************************** Drop-down Menus **********************************************/

	$('#links-edit').click(function(){
		if(!drawingLinks && !editingLinks){
			$(this).toggleClass('upside');
			$('#links-dropdown').slideToggle(200);
			closeDropdowns('#links-dropdown', this);
		}
	});

	$('#links-dropdown-draw').click(function(){
		drawingLinks = true;
		linksDrawn = false;
		linksRemoved = false;
		linksSaveState = $('#links > .link');
		$('.page').addClass('link-creation');
		var btnAdded = false;
		$('#delete-link').show();
		$('#links-dropdown > span').animate({ opacity: 0 }, {duration: 300, complete: function(){
			$('#links-dropdown > span').hide();
			if(!btnAdded){
		        var undoBtn = $('<div/>', {
		            text: 'Undo',
		            class: 'cancel-style',
		            onclick: 'undoDrawingLinks();'
		        	});
		        $(undoBtn).css({
		        	'opacity': 0,
		        	'padding': '0px 20px',
		        	'line-height': '28px',
		        	'margin': '4px',
		        	'margin-bottom': '8px'
		        });
		        var saveBtn = $('<div/>', {
		            text: 'Done',
		            class: 'save-style',
		            onclick: 'doneDrawingLinks();'
		        	});
		        $(saveBtn).css({
		        	'opacity': 0,
		        	'padding': '0px 20px',
		        	'line-height': '28px',
		        	'margin': '4px'
		        });
		        $(undoBtn).appendTo('#links-dropdown');
		        $(saveBtn).appendTo('#links-dropdown');
		        $(saveBtn).animate({ opacity: 1 }, 400);
		        $(undoBtn).animate({ opacity: 1 }, 400);
		        btnAdded = true;
		    }
	    }});
	});

	$('#links-dropdown-edit').click(function(){
		editingLinks = true;
		linksEdited = false;
		linksRemoved = false;
		linksSaveState = $('#links > .link');
		var btnAdded = false;
		$('#delete-link').show();
		$('#links-dropdown > span').animate({ opacity: 0 }, {duration: 300, complete: function(){
			$('#links-dropdown > span').hide();
			if(!btnAdded){
		        var undoBtn = $('<div/>', {
		            text: 'Undo',
		            class: 'cancel-style',
		            onclick: 'undoEditingLinks();'
		        	});
		        $(undoBtn).css({
		        	'opacity': 0,
		        	'padding': '0px 20px',
		        	'line-height': '28px',
		        	'margin': '4px',
		        	'margin-bottom': '8px'
		        });
		        var saveBtn = $('<div/>', {
		            text: 'Done',
		            class: 'save-style',
		            onclick: 'doneEditingLinks();'
		        	});
		        $(saveBtn).css({
		        	'opacity': 0,
		        	'padding': '0px 20px',
		        	'line-height': '28px',
		        	'margin': '4px'
		        });
		        $(undoBtn).appendTo('#links-dropdown');
		        $(saveBtn).appendTo('#links-dropdown');
		        $(saveBtn).animate({ opacity: 1 }, 400);
		        $(undoBtn).animate({ opacity: 1 }, 400);
		        btnAdded = true;
		    }
	    }});
    	$('#popup-menu').hide();
		$('#link-actions').animate({ opacity: 0 }, { duration: 0, complete: function(){ 
	    	$('#link-actions').hide();
		    $('#no-links-selected').show();
		    $('#no-links-selected').animate({ opacity: 1 }, 0);
	    }});
	    openRightMenu();
	});

	$('#links-dropdown-hide').click(function(){
		if($(this).hasClass('are-hidden')){
			$(this).removeClass('are-hidden');
			/*$('#links > .link').animate({ opacity: 1 }, 400);
			$('#links > .link').css({ opacity:1 });*/
			$(hideLinksStyle).remove();
			$(this).text('Hide Links');
		}else{
			$(this).addClass('are-hidden');
			//$('#links > .link').animate({ opacity: 0 }, 400);
			//$('#links > .link').css({ opacity:0 });
			$(hideLinksStyle).appendTo('head');
			$(this).text('Unhide Links');
		}
	});

	$('#image-edit').click(function(){
		$(this).toggleClass('upside');
		$('#image-dropdown').slideToggle(200);
		closeDropdowns('#image-dropdown', this);
	});

	$('#jump-page').click(function(){
		$(this).toggleClass('upside');
		$('#jump-page-dropdown').slideToggle(200);
		closeDropdowns('#jump-page-dropdown', this);
	});

	$('#uploadBtn').change(function () {
		var fileParts = this.value.split("\\");
	    $('#uploadFile').val(fileParts[fileParts.length-1]);
	});

	$('#flow-edit').click(function(){
		if(!drawingLinks && !editingLinks){
			$(this).toggleClass('upside');
			$('#flow-dropdown').slideToggle(200);
			closeDropdowns('#flow-dropdown', this);
		}
	});




/********************************************** Pop-up Menu **********************************************/

	$('#page-inner-container').scroll(function(){ // Hide the menu when we scroll
        //deselectLinkElem();
	});

	$(document).click(function(event) { // Hide the menu when the user clicks away from a link
	    if(!$(event.target).closest('.link, #popup-menu, #right-container').length) {
	    	if($(event.target).closest('#links').length && $('#links').hasClass('noclick')){
	    		$('#links').removeClass('noclick');
	    	}else if($('#popup-menu').is(":visible")) {
	        	popupMenuReferencing = null;
	            deselectLinkElem();
	        }
	    }        
	});



/********************************************** Flow Editor **********************************************/

	document.getElementById('flow-name-sp').addEventListener("input", function() {
	    if($('#flow-name-sp').text() != currFlowName && $('#flow-name-sp').text() != ''){
        	$('#save-flow').removeClass('disabled');
        }else{
        	$('#save-flow').addClass('disabled');
        }
	}, false);

	$('#save-flow').click(function(){
		if(!$(this).hasClass('disabled') && $('#flow-name-sp').text() != ''){
			currFlowName = $('#flow-name-sp').text();
			var dataObj = {
				flowName: currFlowName
			}
			var dataStr = JSON.stringify(dataObj);
			var apiUrl = '/flows/' + currPageId,
				apiMethod = 'PUT';
			if(currPageId != null && currPageId != ''){
				$.ajax({
					type: apiMethod,
					url: apiUrl,
					data: dataStr,
					contentType: 'application/json',
					success: function(msg) {},
					error: function(err) {}
			    }).done(function(response) {
			    	$('#save-flow').addClass('disabled');
			    	$('#delete-flow').removeClass('disabled');
			    	var selector = '.jump-flow[val-id="' + currPageId + '"]';
			    	var existingObj = $(selector);
			    	if(existingObj.length > 0){
			    		$(existingObj).text(currFlowName);
			    	}else{
						var jumpFlowObj = $('<span/>', {
							'class': 'jump-flow',
							'text': currFlowName,
							'val-id': currPageId,
		            		'onclick': 'jumpToPage(this)'
						});
						$(jumpFlowObj).appendTo('#jump-flows');
					}
			    });
			}
		}
	});

	$('#delete-flow').click(function(){
		if(!$(this).hasClass('disabled') && currFlowName != null && currPageId != ''){
			var dataStr = JSON.stringify({ id: currPageId });
			var apiUrl = '/flows/' + currPageId,
				apiMethod = 'DELETE';
			if(currPageId != null && currPageId != ''){
				$.ajax({
					type: apiMethod,
					url: apiUrl,
					contentType: 'application/json',
					success: function(msg) {},
					error: function(err) {}
			    }).done(function(response) {
			    	$('#flow-name-sp').text('');
			    	$('#save-flow').addClass('disabled');
			    	$('#delete-flow').addClass('disabled');
			    	var selector = '.jump-flow[val-id="' + currPageId + '"]';
			    	$(selector).remove();
			    });
			}
		}
	});


/********************************************** Link Editor **********************************************/

	$('#linked-page')
		.drag("start", function( ev, dd ){
			if(!isRedrawing){
				var dragging = $('<div/>', {
		            'class': 'existing-page',
		            'text': $(ev.target).text()
		        	});
				var leftPos = dd.startX - $('#right-container').position().left - ($(ev.target).width() / 2);
				$(dragging).css({
					left: dd.startX - ($(ev.target).width() / 2),
					top: dd.startY - ($(ev.target).height() / 2) - 5
				});
				$(dragging).appendTo(document.body);
			}
        }, {distance:5})

        .drag(function( ev, dd ){
			if(!isRedrawing){
				var leftPos = ev.pageX;
				var topPos = ev.pageY;
				$('.existing-page').css({
					left: leftPos,
					top: topPos
				});

				var dropzone = $('#linked-page'),
					dropPos = $(dropzone).offset();
				if(ev.pageX >= dropPos.left && ev.pageX <= dropzone.width() + dropPos.left && ev.pageY >= dropPos.top && ev.pageY <= dropzone.height() + dropPos.top){
					$('#linked-page').addClass('dragover');
				}else{
					$('#linked-page').removeClass('dragover');
				}
			}
		})

		.drag("end",function( ev, dd ){
			if(!isRedrawing){
				var dropzone = $('#linked-page'),
					dropPos = $(dropzone).offset();
				if(ev.pageX >= dropPos.left && ev.pageX <= dropzone.width() + dropPos.left && ev.pageY >= dropPos.top && ev.pageY <= dropzone.height() + dropPos.top){
					//alert('Dropped in Zone');
				}else{
					$('#linked-page-placeholder').show();
					$('#linked-page-obj').hide();
					if(targetPageExisted){
						enableSaveLinkButton();
					}else{
						disableSaveLinkButton();
					}
					calcPagesPosition();
				}
				$('#linked-page').removeClass('dragover');
				$('.existing-page').remove();
			}
		});

	$('.page-item > select').change(function(){
		$('#save-link-button').removeClass('disabled');
	})
});

function pageDragStart(e){
	if(!isRedrawing){
		var dragging = $('<div/>', {
            'class': 'dragging-page',
            'text': $(e.target).text(),
            'val-id': $(e.target).attr('val-id')
        	});
		var leftPos = e.pageX;
		$(dragging).css({
			left: e.pageX,
			top: e.pageY
		});
		$(dragging).appendTo(document.body);
	}
}

function pageDrag(e){
	if(!isRedrawing){
		var leftPos = e.pageX;
		var topPos = e.pageY;
		$('.dragging-page').css({
			left: leftPos,
			top: topPos
		});

		var dropzone = $('#linked-page'),
			dropPos = $(dropzone).offset();
		if(e.pageX >= dropPos.left && e.pageX <= dropzone.width() + dropPos.left && e.pageY >= dropPos.top && e.pageY <= dropzone.height() + dropPos.top){
			$('#linked-page').addClass('dragover');
		}else{
			$('#linked-page').removeClass('dragover');
		}
	}
}

function pageDragEnd(e){
	if(!isRedrawing){
		var dropzone = $('#linked-page'),
			dropPos = $(dropzone).offset();
		if(e.pageX >= dropPos.left && e.pageX <= dropzone.width() + dropPos.left && e.pageY >= dropPos.top && e.pageY <= dropzone.height() + dropPos.top){
			$('#linked-page-placeholder').hide();
			$('#linked-page-obj').show();
			$('#linked-page-obj').text($('.dragging-page').text());
			$('#linked-page-obj').attr('val-id', $('.dragging-page').attr('val-id'));
			calcPagesPosition();
			enableSaveLinkButton();
		}
		$('#linked-page').removeClass('dragover');
		$('.dragging-page').remove();
	}
}




/*****************************************************************************************************************/
/*****************************************************************************************************************/
/********************************************** Non-Bound Functions **********************************************/
/*****************************************************************************************************************/
/*****************************************************************************************************************/



/********************************************** Main Container **********************************************/

function createNewPage(){
	if(hasNothingUnsaved()){
		noImage = true;
		currPageId = '';
		// Set the page name
		currPageName = '';
		$('#page-name').text(currPageName);
		$('#page-name-sp').text(currPageName);
		$('#page-name-sp').addClass('highlight');
		// Remove the image src attribute
		$('.page-img').removeAttr('src');
		// Overlay the links
		$('#links > .link').remove();
		$('#popup-menu').hide();
		// Dropdown the "Image" dropdown and don't let it undrop until an image has been chosen
		closeDropdowns(null, null);
		$('#image-dropdown').slideDown(200);
		$('#image-edit').addClass('upside');
		// Unhide the jump pages
		var selector = '.page-obj, .jump-page-obj';
		$(selector).removeClass('noshow');
	}else{
		alert('You haven\'t saved something');
	}
}

function hasNothingUnsaved(){
	return true;
}



/********************************************** Main Container **********************************************/

function selectLink(elem){
	if(editingLinks || drawingLinks){
    	selectLinkElem(elem);
	}else{
	    popupMenuReferencing = elem;
		followLink();
	}
}

function deselectLinkElem(){
	if(!unsavedLinkEdit){
		$('#popup-menu').hide();
		hideLinkEditor(400);
		popupMenuReferencing = null;
	}
}

function selectLinkElem(elem){
	if(!unsavedLinkEdit || isRedrawing){
		// Setup the trash icon next to the link box
		$('#link-edit > #popup-menu').css({
	    	'top': $(elem).offset().top,
	    	'left': $(elem).offset().left + $(elem).width() + 1,
	    	'display': 'block'
	    });
	    // Fill in the Link Editor fields
	    linkInitialState = $(elem).clone();
		$(linkInitialState).addClass('hidden').appendTo('#links');
		targetPageExisted = false;
		var linkInfo = getPageInfoByLink($(elem));
		if(linkInfo != null){
			$('#linked-page-obj').text(linkInfo.pageName);
			$('#linked-page-obj').attr('val-id', linkInfo.pageId);
			$('#linked-page-placeholder').hide();
			$('#linked-page-obj').show();
			targetPageExisted = true;
		}else{
			$('#linked-page-obj').hide();
			$('#linked-page-placeholder').show();
			targetPageExisted = false;
		}
		if($(elem).attr('val-transition')){
			prefillTransition($(elem).attr('val-transition'));
		}else{
			prefillTransition('default');
		}
		// Display the Link Editor
		showLinkEditor(400);
	}
}

function followLink(){
	if(popupMenuReferencing != null){
		var linkInfo = getPageInfoByLink(popupMenuReferencing);
		if(linkInfo != null){
			//alert('Jump to "' + linkInfo.pageName + '" (Page ' + linkInfo.pageId + ')');
			var transition = $(popupMenuReferencing).attr('val-transition');
			loadPage(linkInfo.pageId, transition);
		}else{
			alert('Page not found');
		}
	}
}

function deleteLink(){
	if(popupMenuReferencing != null){
		$(popupMenuReferencing).remove();
		popupMenuReferencing = null;
		$('#link-edit > #popup-menu').hide();
		$('.link.hidden').remove();
		hideLinkEditor(400);
		linksRemoved = true;
	}
}




/********************************************** Page Name Editor **********************************************/

function updatePageObjects(newName, existingPage){
	var selector = '.page-obj[val-id="' + currPageId + '"], .jump-page-obj[val-id="' + currPageId + '"]';
	if(existingPage && $(selector).length > 0){
		$(selector).text(newName);
	}else{
		var jumpPageObj = $('<div/>', {
            'class': 'jump-page-obj noshow',
            'text': newName,
            'val-id': currPageId,
            'onclick': 'jumpToPage(this)'
        	});
		$(jumpPageObj).appendTo('#jump-page-dropdown');
		var linkPageObj = $('<div/>', {
            'class': 'page-obj noshow',
            'text': newName,
            'val-id': currPageId
        	});
		$(linkPageObj).appendTo('#other-pages');
		$(linkPageObj).bind({
			dragstart: function(event){ pageDragStart(event); },
			drag: function(event){ pageDrag(event); },
			dragend: function(event){ pageDragEnd(event); }
		});
	}
}




/********************************************** Link Editor **********************************************/

function editLink(){
	if(popupMenuReferencing != null && !unsavedLinkEdit){
		linkInitialState = $(popupMenuReferencing).clone();
		$(linkInitialState).addClass('hidden').appendTo('#links');
		disableDoneWithLinks();
		targetPageExisted = false;
		var linkInfo = getPageInfoByLink($(popupMenuReferencing));
		if(linkInfo != null){
			$('#linked-page-obj').text(linkInfo.pageName);
			$('#linked-page-obj').attr('val-id', linkInfo.pageId);
			$('#linked-page-placeholder').hide();
			$('#linked-page-obj').show();
			targetPageExisted = true;
		}else{
			$('#linked-page-obj').hide();
			$('#linked-page-placeholder').show();
			targetPageExisted = false;
		}
		if($(popupMenuReferencing).attr('val-transition')){
			prefillTransition($(popupMenuReferencing).attr('val-transition'));
		}else{
			prefillTransition('default');
		}
		openRightMenu();
	}
}

function prefillTransition(val){
	$('#link-options > .page-item > select option').filter(function() { 
        return ($(this).val() == val); //To select Blue
    }).prop('selected', true);
}

function saveLink(elem){
	if(!$(elem).hasClass('disabled')){
		$('.link.hidden').remove();
		$(popupMenuReferencing).attr('val-transition', $('#link-options > .page-item > select').val());
		if($('#linked-page-obj').is(":visible") && $('#linked-page-obj').attr('val-id') != 'new'){
			$(popupMenuReferencing).addClass('complete');
			$(popupMenuReferencing).attr('val-targetId', $('#linked-page > #linked-page-obj').attr('val-id'));
		}else{
			$(popupMenuReferencing).removeClass('complete');
			$(popupMenuReferencing).removeAttr('val-targetId');
		}
		$('#save-link-button').addClass('disabled');
		linksEdited = true;
	}
}

function cancelLink(){
	hideLinkEditor(400);
	$('#popup-menu').hide();
	$(linkInitialState).removeClass('hidden');
	$(popupMenuReferencing).remove();
}

function openRightMenu(){
	$('#link-options > .page-item > select').blur();
	$('#right-container').stop().animate({
    	left: '0px'
    },{ duration:300, queue:false, complete: function(){ calcPagesPosition(); } });
    // TODO: Disable all buttons/fields and have a message like "Select a link to edit"
	
}

function closeRightMenu(){
	$('#right-container').stop().animate({
        left: '-300px'
    },{ duration:300, queue:false });
}

function hideLinkEditor(speed){
	$('#save-link-button').addClass('disabled');
    $('#link-actions').animate({ opacity: 0 }, { duration: speed, complete: function(){ 
    	$('#link-actions').hide();
	    $('#no-links-selected').show();
	    $('#no-links-selected').animate({ opacity: 1 }, speed);
    }});
}

function showLinkEditor(speed){
	$('#save-link-button').addClass('disabled');
    $('#no-links-selected').animate({ opacity: 0 }, { duration: speed, complete: function(){ 
    	$('#no-links-selected').hide();
	    $('#link-actions').show();
	    calcPagesPosition();
	    $('#link-actions').animate({ opacity: 1 }, speed);
    }});
}

function redrawLink(elem){
	if(isRedrawing){
		// Redrawing cancelled, revert everything back to normal
		isRedrawing = false;
		$(elem).text('Re-draw Link');
		enableRightMenuLinksExcept(elem);
		$(linkBeingRedrawn).removeClass('hidden');
		selectLinkElem(linkBeingRedrawn);
	}else{
		// Initiate redrawing
		isRedrawing = true;
		$(elem).text('Cancel Link Re-draw');
		disableRightMenuLinksExcept(elem);
		// Store the old link in case we cancel the redraw
		linkBeingRedrawn = popupMenuReferencing;
		$(linkBeingRedrawn).addClass('hidden');
		$('#popup-menu').hide();
	}
}

function enableSaveLinkButton(){
	$('#save-link-button').removeClass('disabled');
}

function disableSaveLinkButton(){
	$('#save-link-button').addClass('disabled');
}

function calcPagesPosition(){
	var label = $('#link-options + .container-title');
	var pos = $('#link-options').outerHeight() + 20;
	$('#other-pages').css({
		top: pos + 'px'
	});
}





/********************************************** Drop Downs **********************************************/

function doneDrawingLinks(){
	drawingLinks = false;
	$('#popup-menu').hide();
	$('.page').removeClass('link-creation');
	var animationDone = false;
	$('#links-dropdown > .save-style, #links-dropdown > .cancel-style').animate({ opacity: 0 }, {duration: 400, complete: function(){
		if(!animationDone){
			$('#links-dropdown > .save-style, #links-dropdown > .cancel-style').remove();
			$('#links-dropdown > span').css({ opacity: 0 });
			$('#links-dropdown > span').show();
			$('#links-dropdown > span').animate({ opacity: 1 }, 300);
			animationDone = true;
		}
	}});
	$('#links > .link.hidden').remove();
	if(linksDrawn || linksRemoved){
		var dataObj = { links: [] };
		var links = $('#links > .link');
		for(var i=0; i<links.length; i++){
			dataObj.links.push({
				target: $(links[i]).attr('val-targetId'),
				transition: $(links[i]).attr('val-transition'),
				coordinates: {
					x: $(links)[i].style.left,
					y: $(links)[i].style.top,
					width: $(links)[i].style.width,
					height: $(links)[i].style.height
				}
			});
		}
		var dataStr = JSON.stringify(dataObj);
		$.ajax({
			type: 'PUT',
			url: '/pages/links/' + currPageId,
			data: dataStr,
			contentType: 'application/json',
			success: function(msg) {},
			error: function(err) {}
	    }).done(function(response) {
	    	// Disable the Apply button
	    });
	}
	closeDropdowns(null, null);
}

function undoDrawingLinks(){
	drawingLinks = false;
	if(linksDrawn){
		$('#links > .link').remove();
		for(var i=0; i<linksSaveState.length; i++){
			$(linksSaveState[i]).appendTo('#links')
		}
	}
	$('#popup-menu').hide();
	$('.page').removeClass('link-creation');
	var animationDone = false;
	$('#links-dropdown > .save-style, #links-dropdown > .cancel-style').animate({ opacity: 0 }, {duration: 400, complete: function(){
		if(!animationDone){
			$('#links-dropdown > .save-style, #links-dropdown > .cancel-style').remove();
			$('#links-dropdown > span').css({ opacity: 0 });
			$('#links-dropdown > span').show();
			$('#links-dropdown > span').animate({ opacity: 1 }, 300);
			animationDone = true;
		}
	}});
	closeDropdowns(null, null);
}

function doneEditingLinks(){
	editingLinks = false;
	closeRightMenu();
	$('#popup-menu').hide();
	var animationDone = false;
	$('#links-dropdown > .save-style, #links-dropdown > .cancel-style').animate({ opacity: 0 }, {duration: 400, complete: function(){
		if(!animationDone){
			$('#links-dropdown > .save-style, #links-dropdown > .cancel-style').remove();
			$('#links-dropdown > span').css({ opacity: 0 });
			$('#links-dropdown > span').show();
			$('#links-dropdown > span').animate({ opacity: 1 }, 300);
			animationDone = true;
		}
	}});
	$('#links > .link.hidden').remove();
	if(linksEdited || linksRemoved){
		var dataObj = { links: [] };
		var links = $('#links > .link');
		for(var i=0; i<links.length; i++){
			dataObj.links.push({
				target: $(links[i]).attr('val-targetId'),
				transition: $(links[i]).attr('val-transition'),
				coordinates: {
					x: $(links)[i].style.left,
					y: $(links)[i].style.top,
					width: $(links)[i].style.width,
					height: $(links)[i].style.height
				}
			});
		}
		var dataStr = JSON.stringify(dataObj);
		$.ajax({
			type: 'PUT',
			url: '/pages/links/' + currPageId,
			data: dataStr,
			contentType: 'application/json',
			success: function(msg) {},
			error: function(err) {}
	    }).done(function(response) {
	    	// Disable the Apply button
	    });
	}
	closeDropdowns(null, null);
}

function undoEditingLinks(){
	editingLinks = false;
	closeRightMenu();
	if(linksEdited){
		$('#links > .link').remove();
		for(var i=0; i<linksSaveState.length; i++){
			$(linksSaveState[i]).appendTo('#links')
		}
	}
	$('#popup-menu').hide();
	var animationDone = false;
	$('#links-dropdown > .save-style, #links-dropdown > .cancel-style').animate({ opacity: 0 }, {duration: 400, complete: function(){
		if(!animationDone){
			$('#links-dropdown > .save-style, #links-dropdown > .cancel-style').remove();
			$('#links-dropdown > span').css({ opacity: 0 });
			$('#links-dropdown > span').show();
			$('#links-dropdown > span').animate({ opacity: 1 }, 300);
			animationDone = true;
		}
	}});
	closeDropdowns(null, null);
}

function closeDropdowns(exceptDropdown, exceptMenu){
	$('.header-dropdown').not(exceptDropdown).slideUp(200);
	$('.header-section').not(exceptMenu).removeClass('upside');
}




/********************************************** Utility Functions **********************************************/

function dump(obj) {
    var out = '';
    for(var i in obj) {
        out += i + ": " + obj[i] + "\n";
    }
    alert(out);
}


function apply(elem){
	if(!$(elem).hasClass('disabled')){
		// Save the info
		var dataToPost = {
			pageName: $('#page-name').text(),
			image: $('#foreground-img').attr('src'),
			links: []
		};

		var links = $('#links > .link');
		for(var i=0; i<links.length; i++){
			dataToPost.links.push({
				target: $(links[i]).attr('val-targetId'),
				transition: $(links[i]).attr('val-transition'),
				coordinates: {
					x: $(links)[i].style.left,
					y: $(links)[i].style.top,
					width: $(links)[i].style.width,
					height: $(links)[i].style.height
				}
			});
		}
		var dataStr = JSON.stringify(dataToPost);
		$.ajax({
			type: 'PUT',
			url: '/pages/' + currPageId,
			data: dataStr,
			contentType: 'application/json',
			success: function(msg) {},
			error: function(err) {}
	    }).done(function(response) {
	    	// Disable the Apply button
	    });
	}
}

function readImage(input) {
    if ( input.files && input.files[0] ) {
        var FR= new FileReader();
        FR.onload = function(e) {
             var imageData = e.target.result;
             //sendImage(imageData);
        };       
        sendImage(input);
        FR.readAsDataURL( input.files[0] );
    }else{
    	return null;
    }
}

function sendImage(imageData){
	if(currPageId != null){
		$.ajax({
			type: 'PUT',
			url: '/pages/images/' + currPageId,
			data: imageData,
			contentType: 'application/json',
			success: function(msg) {},
			error: function(err) {}
	    }).done(function(response) {
	    	//alert(response);
	    });
	}else{
		// New page, use POST
		alert('New page!');

	}
}

function deletePage(){
	$.ajax({
		type: 'DELETE',
		url: '/pages/' + currPageId,
		contentType: 'application/json',
		success: function(msg) {},
		error: function(err) {}
    }).done(function(response) {
    	var selector = '.page-obj[val-id="' + currPageId + '"], .jump-page-obj[val-id="' + currPageId + '"]';
    	$(selector).remove();
    	createNewPage();
    });
}