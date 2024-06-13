/***************************************************
==================== JS INDEX ======================
****************************************************
01. PreLoader Js
02. Mobile Menu Js
03. Sidebar Js
04. Body overlay Js
05. Search Js
06. Sticky Header Js
07. Data CSS Js
08. Nice Select Js
09. slider__active Slider Js
10. product__sale-slider
11. product__item-slider
12. product__item-slider-2
13. product-slider-3
14. product__item-trending-slider
15. product__item-trending-slider-2
16. product__hot-slider
17. banner__slider-active
18. blog__slider
19. brand__slider
20. brand__slider-2
21. blog__slider-2
22. blog__slider-3
23. product__tb-slider
24. Masonary Js
25. magnificPopup img view
26. magnificPopup video view
27. Wow Js
28. Cart Quantity Js
29. Show Login Toggle Js
30. Show Coupon Toggle Js
31. Create An Account Toggle Js
32. Shipping Box Toggle Js
33. Parallax Js
34. InHover Active Js
35. Data Countdown Js
36. range slider activation

****************************************************/

(function ($) {
	"use strict";

	////////////////////////////////////////////////////
	// 01. Preloder Js
	$(window).on('load',function() {
		$("#loading").fadeOut(500);
	});

	////////////////////////////////////////////////////
	// 02. Mobile Menu Js
	$('#mobile-menu').meanmenu({
		meanMenuContainer: '.mobile-menu',
		meanScreenWidth: "1199",
		meanExpand: ['<i class="fal fa-plus"></i>'],
	});
	$('#mobile-menu-2').meanmenu({
		meanMenuContainer: '.mobile-menu-2',
		meanScreenWidth: "1199",
		meanExpand: ['<i class="fal fa-plus"></i>'],
	});

	////////////////////////////////////////////////////
	// 03. Sidebar Js
	$(".offcanvas-toggle-btn").on("click", function () {
		$(".offcanvas__area").addClass("opened");
		$(".body-overlay").addClass("opened");
	});
	$(".offcanvas__close-btn").on("click", function () {
		$(".offcanvas__area").removeClass("opened");
		$(".body-overlay").removeClass("opened");
	});

	////////////////////////////////////////////////////
	// 04. Body overlay Js
	$(".body-overlay").on("click", function () {
		$(".offcanvas__area").removeClass("opened");
		$(".body-overlay").removeClass("opened");
	});

	////////////////////////////////////////////////////
	// 05. Search Js
	$(".search-toggle").on("click", function () {
		$(".search__area").addClass("opened");
	});
	$(".search-close-btn").on("click", function () {
		$(".search__area").removeClass("opened");
	});

	////////////////////////////////////////////////////
	// 07. Data CSS Js
	$("[data-background").each(function () {
		$(this).css("background-image", "url( " + $(this).attr("data-background") + "  )");
	});
	$("[data-width]").each(function () {
		$(this).css("width", $(this).attr("data-width"));
	});

	$("[data-bg-color]").each(function () {
        $(this).css("background-color", $(this).attr("data-bg-color"));
    });

	////////////////////////////////////////////////////
	// 08. Nice Select Js
	$('select').niceSelect();

	////////////////////////////////////////////////////
	// 09. slider__active Slider Js
	if (jQuery(".slider__active").length > 0) {
		let sliderActive1 = ".slider__active";
		let sliderInit1 = new Swiper(sliderActive1, {
			// Optional parameters
			slidesPerView: 1,
			slidesPerColumn: 1,
			paginationClickable: true,
			loop: true,
			effect: 'fade',

			autoplay: {
				delay: 5000,
			},


			// Navigation arrows
			navigation: {
				nextEl: ".main-slider-button-next",
				prevEl: ".main-slider-button-prev",
			},

			a11y: false,
		});

		function animated_swiper(selector, init) {
			let animated = function animated() {
				$(selector + " [data-animation]").each(function () {
					let anim = $(this).data("animation");
					let delay = $(this).data("delay");
					let duration = $(this).data("duration");

					$(this)
						.removeClass("anim" + anim)
						.addClass(anim + " animated")
						.css({
							webkitAnimationDelay: delay,
							animationDelay: delay,
							webkitAnimationDuration: duration,
							animationDuration: duration,
						})
						.one(
							"webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",
							function () {
								$(this).removeClass(anim + " animated");
							}
						);
				});
			};
			animated();
			// Make animated when slide change
			init.on("slideChange", function () {
				$(sliderActive1 + " [data-animation]").removeClass("animated");
			});
			init.on("slideChange", animated);
		}

		animated_swiper(sliderActive1, sliderInit1);
	}
	var sliderr = new Swiper('.active-class', {
		slidesPerView: 1,
		spaceBetween: 30,
		loop: true,
		pagination: {
			el: ".testimonial-pagination-6",
			clickable: true,
			renderBullet: function (index, className) {
			  return '<span class="' + className + '">' + '<button>'+(index + 1)+'</button>' + "</span>";
			},
		},
		breakpoints: {
			'1200': {
				slidesPerView: 3,
			},
			'992': {
				slidesPerView: 2,
			},
			'768': {
				slidesPerView: 2,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});

	///////////////////////////////////////////////////
	// 10. product__sale-slider
	$(".product__sale-slider").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 0,
		items: 1,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: true,
		dots: false,
		responsive: {
			0: {
				items: 1
			},
			767: {
				items: 1
			},
			992: {
				items: 1
			},
			1200: {
				items: 1
			}
		}
	});

	///////////////////////////////////////////////////
	// 11. product__item-slider
	$(".product__item-slider").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 28,
		items: 3,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: true,
		dots: true,
		responsive: {
			0: {
				items: 1
			},
			576: {
				items: 2
			},
			767: {
				items: 2
			},
			992: {
				items: 2
			},
			1200: {
				items: 3
			},
			1400: {
				items: 3
			}
		}
	});

	///////////////////////////////////////////////////
	// 12. product__item-slider-2
	$(".product__item-slider-2").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 2,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: true,
		dots: true,
		responsive: {
			0: {
				items: 1
			},
			576: {
				items: 1
			},
			767: {
				items: 2
			},
			992: {
				items: 1
			},
			1200: {
				items: 2
			},
			1400: {
				items: 2
			}
		}
	});

	///////////////////////////////////////////////////
	// 13. product-slider-3
	$(".product-slider-3").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 2,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: false,
		dots: true,
		responsive: {
			0: {
				items: 1
			},
			576: {
				items: 1
			},
			767: {
				items: 1
			},
			992: {
				items: 1
			},
			1200: {
				items: 1
			},
			1400: {
				items: 1
			}
		}
	});

	///////////////////////////////////////////////////
	// 14. product__item-trending-slider
	$(".product__item-trending-slider").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 3,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: true,
		dots: false,
		responsive: {
			0: {
				items: 1
			},
			767: {
				items: 3
			},
			992: {
				items: 4
			},
			1200: {
				items: 5
			}
		}
	});

	///////////////////////////////////////////////////
	// 15. product__item-trending-slider-2
	$(".product__item-trending-slider-2").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 3,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: false,
		dots: true,
		responsive: {
			0: {
				items: 1
			},
			767: {
				items: 3
			},
			992: {
				items: 4
			},
			1200: {
				items: 5
			}
		}
	});

	///////////////////////////////////////////////////
	// 16. product__hot-slider
	$(".product__hot-slider").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 3,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: true,
		dots: false,
		responsive: {
			0: {
				items: 1
			},
			767: {
				items: 3
			},
			992: {
				items: 2
			},
			1200: {
				items: 3
			}
		}
	});

	///////////////////////////////////////////////////
	// 17. banner__slider-active
	$(".banner__slider-active").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 3,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: true,
		dots: false,
		responsive: {
			0: {
				items: 1
			},
			767: {
				items: 1
			},
			992: {
				items: 1
			},
			1200: {
				items: 1
			}
		}
	});

	///////////////////////////////////////////////////
	// 18. blog__slider
	$(".blog__slider").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 3,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: true,
		dots: false,
		responsive: {
			0: {
				items: 1
			},
			767: {
				items: 2
			},
			992: {
				items: 2
			},
			1200: {
				items: 3
			}
		}
	});

	///////////////////////////////////////////////////
	// 19. brand__slider
	$(".brand__slider").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 3,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: true,
		dots: false,
		responsive: {
			0: {
				items: 2
			},
			767: {
				items: 2
			},
			992: {
				items: 3
			},
			1200: {
				items: 6
			}
		}
	});

	///////////////////////////////////////////////////
	// 20. brand__slider-2
	$(".brand__slider-2").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 3,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: false,
		dots: false,
		responsive: {
			0: {
				items: 2
			},
			767: {
				items: 4
			},
			992: {
				items: 5
			},
			1200: {
				items: 6
			}
		}
	});

	///////////////////////////////////////////////////
	// 21. blog__slider-2
	$(".blog__slider-2").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 3,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: true,
		dots: false,
		responsive: {
			0: {
				items: 1
			},
			767: {
				items: 2
			},
			992: {
				items: 2
			},
			1200: {
				items: 3
			}
		}
	});

	///////////////////////////////////////////////////
	// 22. blog__slider-3
	$(".blog__slider-3").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 3,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: true,
		dots: false,
		responsive: {
			0: {
				items: 1
			},
			767: {
				items: 2
			},
			992: {
				items: 2
			},
			1200: {
				items: 3
			}
		}
	});

	///////////////////////////////////////////////////
	// 23. product__tb-slider
	$(".product__tb-slider").owlCarousel({
		//add owl carousel in activation class
		loop: true,
		margin: 30,
		items: 3,
		navText: ['<button class="nav-left"><i class="far fa-angle-left"></i></button>', '<button class="nav-right"><i class="far fa-angle-right"></i></button>'],
		nav: true,
		dots: false,
		responsive: {
			0: {
				items: 1
			},
			767: {
				items: 3
			},
			992: {
				items: 4
			},
			1200: {
				items: 5
			}
		}
	});

	////////////////////////////////////////////////////
	// 24. Masonary Js
	$('.grid').imagesLoaded(function () {
		// init Isotope
		var $grid = $('.grid').isotope({
			itemSelector: '.grid-item',
			percentPosition: true,
			masonry: {
				// use outer width of grid-sizer for columnWidth
				columnWidth: '.grid-item',
			}
		});


		// filter items on button click
		$('.masonary-menu').on('click', 'button', function () {
			var filterValue = $(this).attr('data-filter');
			$grid.isotope({ filter: filterValue });
		});

		//for menu active class
		$('.masonary-menu button').on('click', function (event) {
			$(this).siblings('.active').removeClass('active');
			$(this).addClass('active');
			event.preventDefault();
		});

	});

	/*  25. magnificPopup img view */
	$('.popup-image').magnificPopup({
		type: 'image',
		gallery: {
			enabled: true
		}
	});

	/* 26. magnificPopup video view */
	$(".popup-video").magnificPopup({
		type: "iframe",
	});

	////////////////////////////////////////////////////
	// 27. Wow Js
	new WOW().init();

	////////////////////////////////////////////////////
	// 28. Cart Quantity Js
	$('.cart-minus').click(function () {
		var $input = $(this).parent().find('input');
		var count = parseInt($input.val()) - 1;
		count = count < 1 ? 1 : count;
		$input.val(count);
		$input.change();
		return false;
	});
	$('.cart-plus').click(function () {
		var $input = $(this).parent().find('input');
		$input.val(parseInt($input.val()) + 1);
		$input.change();
		return false;
	});

	$(".cart-plus-minus").append('<div class="dec qtybutton">-</div><div class="inc qtybutton">+</div>');
	$(".qtybutton").on("click", function () {
		var $button = $(this);
		var oldValue = $button.parent().find("input").val();
		if ($button.text() == "+") {
			var newVal = parseFloat(oldValue) + 1;
		} else {
			// Don't allow decrementing below zero
			if (oldValue > 0) {
				var newVal = parseFloat(oldValue) - 1;
			} else {
				newVal = 0;
			}
		}
		$button.parent().find("input").val(newVal);
	});

	////////////////////////////////////////////////////
	// 29. Show Login Toggle Js
	$('#showlogin').on('click', function () {
		$('#checkout-login').slideToggle(900);
	});

	////////////////////////////////////////////////////
	// 30. Show Coupon Toggle Js
	$('#showcoupon').on('click', function () {
		$('#checkout_coupon').slideToggle(900);
	});

	////////////////////////////////////////////////////
	// 31. Create An Account Toggle Js
	$('#cbox').on('click', function () {
		$('#cbox_info').slideToggle(900);
	});

	////////////////////////////////////////////////////
	// 32. Shipping Box Toggle Js
	$('#ship-box').on('click', function () {
		$('#ship-box-info').slideToggle(1000);
	});

	////////////////////////////////////////////////////
	// 33. Counter Js
	$('.counter').counterUp({
		delay: 10,
		time: 1000
	});

	////////////////////////////////////////////////////
	// 34. Parallax Js
	if ($('.scene').length > 0) {
		$('.scene').parallax({
			scalarX: 10.0,
			scalarY: 15.0,
		});
	};

	////////////////////////////////////////////////////
	// 35. InHover Active Js
	$('.hover__active').on('mouseenter', function () {
		$(this).addClass('active').parent().siblings().find('.hover__active').removeClass('active');
	});

	////////////////////////////////////////////////////
    // 36. Data Countdown Js
    $('[data-countdown]').each(function() {

        var $this = $(this),
            finalDate = $(this).data('countdown');

        $this.countdown(finalDate, function(event) {

            $this.html(event.strftime('<span class="cdown days"><span class="time-count">%-D</span> <p>Days</p></span> <span class="cdown hour"><span class="time-count">%-H</span> <p>Hrs</p></span> <span class="cdown minutes"><span class="time-count">%M</span> <p>Min</p></span> <span class="cdown second"> <span><span class="time-count">%S</span> <p>Sec</p></span>'));

        });

    });

	////////////////////////////////////////////////////
    // 37. range slider activation
	if ($('#slider-range').length > 0) {
		
		$("#slider-range").slider({
		range: true,
		min: 0,
		max: 500,
		values: [75, 300],
		slide: function (event, ui) {
			$("#amount").val("$" + ui.values[0] + " - $" + ui.values[1]);
		},
		});
	}

})(jQuery);