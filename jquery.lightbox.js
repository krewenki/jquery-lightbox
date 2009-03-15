/**
 * jQuery Lightbox
 * Version 0.5 - 11/29/2007
 * @author Warren Krewenki
 *
 * This package is distributed under the BSD license.
 * For full license information, see LICENSE.TXT
 *
 * Based on Lightbox 2 by Lokesh Dhakar (http://www.huddletogether.com/projects/lightbox2/)
 * Originally written to make use of the Prototype framework, and Script.acalo.us, now altered to use jQuery.
 *
 *
 **/

(function($){
	var opts;

	$.fn.lightbox = function(options){
		// build main options
		opts = $.extend({}, $.fn.lightbox.defaults, options);

		// initalize the lightbox
		$.fn.lightbox.initialize();
		return this.each(function(){
			$(this).click(function(){
				$(this).lightbox.start(this);
				return false;
			});
		});
	};

	
	
	/**
	 * initalize()
	 *
	 * @return void
	 * @author Warren Krewenki
	 */
	$.fn.lightbox.initialize = function(){
		$('#overlay').remove();
		$('#lightbox').remove();
		opts.inprogress = false;
		var outerImage = '<div id="outerImageContainer"><div id="imageContainer"><iframe id="lightboxIframe" /><img id="lightboxImage"><div id="hoverNav"><a href="javascript://" title="' + opts.strings.prevLinkTitle + '" id="prevLink"></a><a href="javascript://" id="nextLink" title="' + opts.strings.nextLinkTitle + '"></a></div><div id="loading"><a href="javascript://" id="loadingLink"><img src="'+opts.fileLoadingImage+'"></a></div></div></div>';
		var imageData = '<div id="imageDataContainer" class="clearfix"><div id="imageData"><div id="imageDetails"><span id="caption"></span><span id="numberDisplay"></span></div><div id="bottomNav">';

		if (opts.displayHelp)
			imageData += '<span id="helpDisplay">' + opts.strings.help + '</span>';

		imageData += '<a href="javascript://" id="bottomNavClose" title="' + opts.strings.closeTitle + '"><img src="'+opts.fileBottomNavCloseImage+'"></a></div></div></div>';

		var string;

		if (opts.navbarOnTop) {
		  string = '<div id="overlay"></div><div id="lightbox">' + imageData + outerImage + '</div>';
		  $("body").append(string);
		  $("#imageDataContainer").addClass('ontop');
		} else {
		  string = '<div id="overlay"></div><div id="lightbox">' + outerImage + imageData + '</div>';
		  $("body").append(string);
		}

		$("#overlay").click(function(){ $.fn.lightbox.end(); }).hide();
		$("#lightbox").click(function(){ $.fn.lightbox.end();}).hide();
		$("#loadingLink").click(function(){ $.fn.lightbox.end(); return false;});
		$("#bottomNavClose").click(function(){ $.fn.lightbox.end(); return false; });
		$('#outerImageContainer').width(opts.widthCurrent).height(opts.heightCurrent);
		$('#imageDataContainer').width(opts.widthCurrent);
		
		if (!opts.imageClickClose) {
    		$("#hoverNav").click(function(){ return false; });
		}
	};


	$.fn.lightbox.getPageSize = function(){
		var jqueryPageSize = new Array($(document).width(),$(document).height(), $(window).width(), $(window).height());
		return jqueryPageSize;
	};


	$.fn.lightbox.getPageScroll = function(){
		var xScroll, yScroll;

		if (self.pageYOffset) {
			yScroll = self.pageYOffset;
			xScroll = self.pageXOffset;
		} else if (document.documentElement && document.documentElement.scrollTop){  // Explorer 6 Strict
			yScroll = document.documentElement.scrollTop;
			xScroll = document.documentElement.scrollLeft;
		} else if (document.body) {// all other Explorers
			yScroll = document.body.scrollTop;
			xScroll = document.body.scrollLeft;
		}

		var arrayPageScroll = new Array(xScroll,yScroll);
		return arrayPageScroll;
	};

	$.fn.lightbox.pause = function(ms){
		var date = new Date();
		var curDate = null;
		do{curDate = new Date();}
		while( curDate - date < ms);
	};

	$.fn.lightbox.start = function(imageLink){

		$("select, embed, object").hide();
		var arrayPageSize = $.fn.lightbox.getPageSize();
		$("#overlay").hide().css({width: '100%', height: arrayPageSize[1]+'px', opacity : opts.overlayOpacity}).fadeIn();
		opts.imageArray = [];
		imageNum = 0;


		// if image is NOT part of a set..
		if(!imageLink.rel || (imageLink.rel == '')){
			// add single image to Lightbox.imageArray
			opts.imageArray.push(new Array(imageLink.href, opts.displayTitle ? imageLink.title : ''));
		} else {
		// if image is part of a set..
			$("a").each(function(){
				if(this.href && (this.rel == imageLink.rel)){
					opts.imageArray.push(new Array(this.href, opts.displayTitle ? this.title : ''));
				}
			});


			for(i = 0; i < opts.imageArray.length; i++){
				for(j = opts.imageArray.length-1; j>i; j--){
					if(opts.imageArray[i][0] == opts.imageArray[j][0]){
						opts.imageArray.splice(j,1);
					}
				}
			}
			while(opts.imageArray[imageNum][0] != imageLink.href) { imageNum++;}
		}

		// calculate top and left offset for the lightbox
		var arrayPageScroll = $.fn.lightbox.getPageScroll();
		var lightboxTop = arrayPageScroll[1] + (arrayPageSize[3] / 10);
		var lightboxLeft = arrayPageScroll[0];
		$('#lightbox').css({top: lightboxTop+'px', left: lightboxLeft+'px'}).show();


		if (!opts.slideNavBar)
			$('#imageData').hide();

		$.fn.lightbox.changeImage(imageNum);

	};

	$.fn.lightbox.changeImage = function(imageNum){
		if(opts.inprogress == false){
			opts.inprogress = true;
			opts.activeImage = imageNum;	// update global var

			// hide elements during transition
			$('#loading').show();
			$('#lightboxImage').hide();
			$('#hoverNav').hide();
			$('#prevLink').hide();
			$('#nextLink').hide();

			if (opts.slideNavBar) { // delay preloading image until navbar will slide up
				// $('#imageDataContainer').slideUp(opts.navBarSlideSpeed, $.fn.doChangeImage);
				$('#imageDataContainer').hide();
				$('#imageData').hide();
				$.fn.doChangeImage();
			} else {
			    $.fn.doChangeImage();
			}
		}
	};

	$.fn.doChangeImage = function(){

		imgPreloader = new Image();

		// once image is preloaded, resize image container
		imgPreloader.onload=function(){
		    var newWidth = imgPreloader.width;
		    var newHeight = imgPreloader.height;


			if (opts.fitToScreen) {
		        var arrayPageSize = $.fn.lightbox.getPageSize();
				var ratio;
				var initialPageWidth = arrayPageSize[2] - 2 * opts.borderSize;
				var initialPageHeight = arrayPageSize[3] - 200;

				if (imgPreloader.height > initialPageHeight)
				{
					newWidth = parseInt((initialPageHeight/imgPreloader.height) * imgPreloader.width);
					newHeight = initialPageHeight;
				}
				else if (imgPreloader.width > initialPageWidth)
				{
					newHeight = parseInt((initialPageWidth/imgPreloader.width) * imgPreloader.height);
					newWidth = initialPageWidth;
				}
			}

			$('#lightboxImage').attr('src', opts.imageArray[opts.activeImage][0])
							   .width(newWidth).height(newHeight);
			$.fn.lightbox.resizeImageContainer(newWidth, newHeight);
		};

		imgPreloader.src = opts.imageArray[opts.activeImage][0];
	};
	
	$.fn.lightbox.end = function(){
		$.fn.lightbox.disableKeyboardNav();
		$('#lightbox').hide();
		$('#overlay').fadeOut();
		$('select, object, embed').show();
	};

	$.fn.lightbox.preloadNeighborImages = function(){
		if(opts.loopImages && opts.imageArray.length > 1) {
	        preloadNextImage = new Image();
	        preloadNextImage.src = opts.imageArray[(opts.activeImage == (opts.imageArray.length - 1)) ? 0 : opts.activeImage + 1][0]
	        
	        preloadPrevImage = new Image();
	        preloadPrevImage.src = opts.imageArray[(opts.activeImage == 0) ? (opts.imageArray.length - 1) : opts.activeImage - 1][0]
	    } else {
		    if((opts.imageArray.length - 1) > opts.activeImage){
			    preloadNextImage = new Image();
			    preloadNextImage.src = opts.imageArray[opts.activeImage + 1][0];
		    }
		    if(opts.activeImage > 0){
			    preloadPrevImage = new Image();
			    preloadPrevImage.src = opts.imageArray[opts.activeImage - 1][0];
		    }
	    }
	};

	$.fn.lightbox.keyboardAction = function(e){
		if (e == null) { // ie
			var keycode = event.keyCode;
			var escapeKey = 27;
		} else { // mozilla
			var keycode = e.keyCode;
			var escapeKey = e.DOM_VK_ESCAPE;
		}

		var key = String.fromCharCode(keycode).toLowerCase();

		if((key == 'x') || (key == 'o') || (key == 'c') || (keycode == escapeKey)){ // close lightbox
			$.fn.lightbox.end();
		} else if((key == 'p') || (keycode == 37)){ // display previous image
			if(opts.activeImage != 0){
				$.fn.lightbox.disableKeyboardNav();
				$.fn.lightbox.changeImage(opts.activeImage - 1);
			}
		} else if((key == 'n') || (keycode == 39)){ // display next image
			if(opts.activeImage != (opts.imageArray.length - 1)){
				$.fn.lightbox.disableKeyboardNav();
				$.fn.lightbox.changeImage(opts.activeImage + 1);
			}
		}
	};

	$.fn.lightbox.resizeImageContainer = function(imgWidth, imgHeight){
		// get current width and height
		opts.widthCurrent = document.getElementById('outerImageContainer').offsetWidth;
		opts.heightCurrent = document.getElementById('outerImageContainer').offsetHeight;

		// get new width and height
		var widthNew = (imgWidth  + (opts.borderSize * 2));
		var heightNew = (imgHeight  + (opts.borderSize * 2));

		// scalars based on change from old to new
		opts.xScale = ( widthNew / opts.widthCurrent) * 100;
		opts.yScale = ( heightNew / opts.heightCurrent) * 100;

		// calculate size difference between new and old image, and resize if necessary
		wDiff = opts.widthCurrent - widthNew;
		hDiff = opts.heightCurrent - heightNew;

		$('#imageDataContainer').animate({width: widthNew},opts.resizeSpeed,'linear');
		$('#outerImageContainer').animate({width: widthNew},opts.resizeSpeed,'linear',function(){
			$('#outerImageContainer').animate({height: heightNew},opts.resizeSpeed,'linear',function(){
				$.fn.lightbox.showImage();
			});
		});

		// if new and old image are same size and no scaling transition is necessary,
		// do a quick pause to prevent image flicker.
		if((hDiff == 0) && (wDiff == 0)){
			if (jQuery.browser.msie){ $.fn.lightbox.pause(250); } else { $.fn.lightbox.pause(100);}
		}

		$('#prevLink').height(imgHeight);
		$('#nextLink').height(imgHeight);
	};

	$.fn.lightbox.showImage = function(){
		$('#loading').hide();
		$('#lightboxImage').fadeIn("fast");
		$.fn.lightbox.updateDetails();
		$.fn.lightbox.preloadNeighborImages();

		opts.inprogress = false;
	};

	$.fn.lightbox.updateDetails = function(){

		$('#numberDisplay').html('');

		if(opts.imageArray[opts.activeImage][1]){
			$('#caption').html(opts.imageArray[opts.activeImage][1]).show();
		}

		// if image is part of set display 'Image x of x'
		if(opts.imageArray.length > 1){
			var nav_html;

			nav_html = opts.strings.image + (opts.activeImage + 1) + opts.strings.of + opts.imageArray.length;

			if (!opts.disableNavbarLinks) {
                // display previous / next text links
                if ((opts.activeImage) > 0 || opts.loopImages) {
                  nav_html = '<a title="' + opts.strings.prevLinkTitle + '" href="#" id="prevLinkText">' + opts.strings.prevLinkText + "</a>" + nav_html;
                }

                if (((opts.activeImage + 1) < opts.imageArray.length) || opts.loopImages) {
                  nav_html += '<a title="' + opts.strings.nextLinkTitle + '" href="#" id="nextLinkText">' + opts.strings.nextLinkText + "</a>";
                }
            }

			$('#numberDisplay').html(nav_html).show();
		}

		if (opts.slideNavBar) {
		    $("#imageData").slideDown(opts.navBarSlideSpeed);
		} else {
			$("#imageData").show();
		}

		var arrayPageSize = $.fn.lightbox.getPageSize();
		$('#overlay').height(arrayPageSize[1]);
		$.fn.lightbox.updateNav();
	};

	$.fn.lightbox.updateNav = function(){
		if(opts.imageArray.length > 1){
			$('#hoverNav').show();
            
            // if loopImages is true, always show next and prev image buttons 
            if(opts.loopImages) {
		        $('#prevLink,#prevLinkText').show().click(function(){
			        $.fn.lightbox.changeImage((opts.activeImage == 0) ? (opts.imageArray.length - 1) : opts.activeImage - 1); return false;
		        });
		        
		        $('#nextLink,#nextLinkText').show().click(function(){
			        $.fn.lightbox.changeImage((opts.activeImage == (opts.imageArray.length - 1)) ? 0 : opts.activeImage + 1); return false;
		        });
		    
		    } else {
			    // if not first image in set, display prev image button
			    if(opts.activeImage != 0){
				    $('#prevLink,#prevLinkText').show().click(function(){
					    $.fn.lightbox.changeImage(opts.activeImage - 1); return false;
				    });
			    }

			    // if not last image in set, display next image button
			    if(opts.activeImage != (opts.imageArray.length - 1)){
				    $('#nextLink,#nextLinkText').show().click(function(){

					    $.fn.lightbox.changeImage(opts.activeImage +1); return false;
				    });
			    }
            }
            
			$.fn.lightbox.enableKeyboardNav();
		}
	};


	$.fn.lightbox.enableKeyboardNav = function(){
		document.onkeydown = $.fn.lightbox.keyboardAction;
	};

	$.fn.lightbox.disableKeyboardNav = function(){
		document.onkeydown = '';
	};

	$.fn.lightbox.defaults = {
		fileLoadingImage : 'images/loading.gif',
		fileBottomNavCloseImage : 'images/closelabel.gif',
		overlayOpacity : 0.8,
		borderSize : 10,
		imageArray : new Array,
		activeImage : null,
		inprogress : false,
		resizeSpeed : 350,
		widthCurrent: 250,
		heightCurrent: 250,
		xScale : 1,
		yScale : 1,
		displayTitle: true,
		navbarOnTop: false,
		slideNavBar: false, // slide nav bar up/down between image resizing transitions
		navBarSlideSpeed: 350,
		displayHelp: false,
		strings : {
			help: ' \u2190 / P - previous image\u00a0\u00a0\u00a0\u00a0\u2192 / N - next image\u00a0\u00a0\u00a0\u00a0ESC / X - close image gallery',
			prevLinkTitle: 'previous image',
			nextLinkTitle: 'next image',
			prevLinkText:  '&laquo; Previous',
			nextLinkText:  'Next &raquo;',
			closeTitle: 'close image gallery',
			image: 'Image ',
			of: ' of '
		},
		fitToScreen: false,		// resize images if they are bigger than window
        disableNavbarLinks: false,
        loopImages: false,
        imageClickClose: true
	};
})(jQuery);
