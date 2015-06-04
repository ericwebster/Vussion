var ExternalData = {
	"client": "Athena Health",
	"devices":[{
			"name":"ipad",
			"freindlyName": "iPad",
			"id":0
		},{
			"name": "Dr. Sharp iPhone",
			"freindlyName": "sharp-iphone",
			"id":1
		},{
			"name": "Terry's iPhone",
			"freindlyName": "terry-iphone",
			"id": 2
		}],
	"modules":[{
		"name": "Loading Screen",
		"id": "0",
		"background" : "data/Sit_Slides/the-cramer-approach-sit.jpg",
		"content":[{
			"name":"loading",
			"deviceID": [0,1,2],
			"type":"slides",
			"media":"data/Sit_Slides/the-cramer-approach-sit.jpg",
			"poster":"data/Sit_Slides/the-cramer-approach-sit.jpg"
		}]
	},{
		"name": "Walk In >> Big Disruptive Facts Slideshow",
		"id": "1",
		"background": "data/Sit_Slides/athena-live-qa-ipad-sit.jpg",
		"content":[{
			"name":"Fact One",
			"deviceID": [0,1,2],
			"type":"slides",
			"media":"data/Big-Disruptive-Facts/01.jpg",
			"poster":"data/Big-Disruptive-Facts/01.jpg"
		},{
			"name":"Fact Two",
			"deviceID": [0,1,2],
			"type":"slides",
			"media":"data/Big-Disruptive-Facts/02.jpg",
			"poster":"data/Big-Disruptive-Facts/02.jpg"
		},{
			"name":"Fact Three",
			"deviceID": [0,1,2],
			"type":"slides",
			"media":"data/Big-Disruptive-Facts/03.jpg",
			"poster":"data/Big-Disruptive-Facts/03.jpg"
		},{
			"name":"Fact Four",
			"deviceID": [0,1,2],
			"type":"slides",
			"media":"data/Big-Disruptive-Facts/04.jpg",
			"poster":"data/Big-Disruptive-Facts/04.jpg"
		}]
	},{
		"name": "Cramer Approach >> Sit Slide",
		"id": "2",
		"background": "data/Sit_Slides/the-cramer-approach-sit.jpg",
		"content":[{
			"name":"Crame Approach Sit Slide",
			"deviceID": [0,1,2],
			"type":"slides",
			"media":"data/Product-Presentation/iPad-1-Phone-Text.mp4",
			"poster":"data/Sit_Slides/athena-live-qa-ipad-sit.jpg"
		}]
	},{
		"name": "Athena's Story >> Sit Slide",
		"id": "3",
		"type": "html",
		"template": "html-template-basic",
		"html": "<img src='data/Sit_Slides/athena-story-ipad-sit.jpg' />"

	},{
		"name": "Product Presentation > Check In: Admin POV",
		"id": "4",
		"placeholder" : "data/Sit_Slides/product-pres-sit.jpg",
		"type": "video",
		"video":[{
			"file": "data/Product-Presentation/iPad-1-Phone-Text.mp4", 
			"name": "iPad-1-Phone-Text"
		},{
			"file": "data/Product-Presentation/iPad-2-Patient-Confirmation.mp4", 
			"name": "iPad-2-Patient-Confirmation"
		},{
			"file": "data/Product-Presentation/iPad-3-Group-Number.mp4", 
			"name": "iPad-3-Group-Number"
		},{
			"file": "data/Product-Presentation/iPad-4-Credit-Card-Payment.mp4", 
			"name": "iPad-4-Credit-Card-Payment"
		},{
			"file": "data/Product-Presentation/iPad-5-Commonwell.mp4", 
			"name": "iPad-5-Commonwell"
		}]
	},{
		"name": "Self Diven Demos",
		"id": "5",
		"type": "html",
		"template": "html-self-driven-demo",
		"html":""
	},{
		"name": "Thank You > Quiet Mode",
		"id": "6",
		"type": "html",
		"template": "html-template-basic",
		"html": "<img src='data/Sit_Slides/live-demo-sit.jpg' />"
	}]
};

/*

sliderObj = {
	"id": "2",
	"name": "Athena Overview",
	"type": "slider",
	"slides": [{
		"media": "data/images/demo-1.jpg",
		"caption": "Title One"
	},{
		"media": "data/images/demo-2.jpg",
		"caption": "Title Two"
	},{
		"media": "data/images/demo-3.jpg",
		"caption": "Title Three"
	},{
		"media": "data/images/demo-4.jpg",
		"caption": "Title Four"
	},{
		"media": "data/images/demo-5.jpg",
		"caption": "Title Five"
	},{
		"media": "data/images/demo-6.jpg",
		"caption": "Title Six"
	},{
		"media": "data/images/demo-7.jpg",
		"caption": "Title Seven"
	},{
		"media": "data/images/demo-8.jpg",
		"caption": "Title Eight"
	}]
	}

*/