var emergencyMarkerClick;
var dictLatLong = [];
var myCoordinates;
var map;
var sightingsArray;
var weatherContent;
var currentLat, currentLng;
var icons = {
    youAreHere: { icon: 'images/youAreHere.png' },
    hospital: { icon: 'images/hospital.png' },
    CYLINDER: { icon: 'images/cylinder.png' },
    LIGHT: { icon: 'images/light.png' },
    CIRCLE: { icon: 'images/circle.png' },
    SPHERE: { icon: 'images/sphere.png' },
    DISK: { icon: 'images/disk.png' },
    FIREBALL: { icon: 'images/fireball.png' },
    OVAL: { icon: 'images/oval.png' },
    CIGAR: { icon: 'images/cigar.png' },
    RECTANGLE: { icon: 'images/rectangle.png' },
    CHEVRON: { icon: 'images/chevron.png' },
    TRIANGLE: { icon: 'images/triangle.png' },
    FORMATION: { icon: 'images/formation.png' },
    DELTA: { icon: 'images/delta.png' },
    EGG: { icon: 'images/egg.png' },
    FLASH: { icon: 'images/flash.png' },
    DIAMOND: { icon: 'images/diamond.png' },
    CROSS: { icon: 'images/cross.png' },
    TEARDROP: { icon: 'images/teardrop.png' },
    CONE: { icon: 'images/cone.png' },
    PYRAMID: { icon: 'images/pyramid.png' },
    ROUND: { icon: 'images/round.png' },
    CRESCENT: { icon: 'images/crescent.png' },
    FLARE: { icon: 'images/flare.png' },
    HEXAGON: { icon: 'images/hexagon.png' },
    DOME: { icon: 'images/dome.png' },
    OTHER: { icon: 'images/other.png' },
    UNKNOWN: { icon: 'images/other.png' },
    CHANGING: { icon: 'images/other.png' }
};
var dropDownList = {
    country: ["Select", "America", "UK", "Canada", "Australia", "Germany"],
    countryVal: ["", "us", "gb", "ca", "au", "de"],
    shape: ["Select", "Cylinder", "Light", "Circle", "Sphere", "Disk", "Fireball", "Oval", "Cigar", "Rectangle", "Chevron", "Triangle", "Formation", "Delta", "Egg", "Flash", "Diamond", "Cross", "Teardrop", "Cone", "Pyramid", "Round", "Crescent", "Flare", "Hexagon", "Dome", "Other"]
}
var filter = "";
/* ========================================================================= */
/*  Preloader
/* ========================================================================= */

jQuery(window).load(function() {
    $("#preloader").fadeOut("slow");
});

$(document).ready(function() {
    //animate -- not working
    $("#circle1").click(function() {
        $('#circle1').animate({ svgFill: 'red' }, 4000);
    });
    //
    plotSightingMarkers();
    $("#slider").click(function() {
        populateFlickrPhotos('UFO from Space');
        $('html, body').animate({
            scrollTop: $("#map_canvas").offset().top
        }, 900);
    });
    /*
        $("#btn").click(function () {//temporary button for infoPane at right
            $("#infoPane").css("display","block");
        });
    */
    $("#subDropDown").change(function() {
        var inputType = $('#subDropDown').find(":selected").val();
        if (inputType != "" && inputType != "Select") {
            //console.log("*********************");
            //console.log(filter + ": " + inputType);
            //console.log("*********************");
            initMap();
            if (filter == "country")
                plotCountryBasedUFOs(inputType);
            else
                plotShapeBasedUFOs(inputType);
        }
    });

    $("#imgSpeak").click(function() {
        var msg = new SpeechSynthesisUtterance("This is a " + $("#shape").val() + "shaped Unidentified Flying Object. People commented on this as " + $("#comment").text());
        window.speechSynthesis.speak(msg);
    });

    $("#btnFlickr").click(function() {
        var photoHashtag = $("#shape").val();
        populateFlickrPhotos(photoHashtag);

        $('#flickrDisplay').show();
        goToByScroll('#flickrPhotos');
    });

    $("#btnYoutube").click(function() {
        var argToSearch = $("#shape").val() + " UFO";

        // Reset the div elements in case a second search is made
        $("#youtube").html("");

        $("#video").html("");

        // prepare the request
        // Build the custom YouTube URL based on the channel and number of videos
        var request = gapi.client.youtube.search.list({
            part: "snippet",
            type: "video",
            q: argToSearch,
            maxResults: 6
        });

        // execute the request
        request.execute(function(response) {
            var results = response.result;
            //console.log(results);

            $.each(results.items, function(index, item) {
                // Extract the video id
                var url = item.id.videoId
                    // Get the title of the video
                var title = item.snippet.title;
                // Get the first 10 characters of date video was published or: YYYY-MM-DD
                var datepublished = item.snippet.publishedAt.substring(0, 10)
                    // Get the channel title
                var author = item.snippet.channelTitle;
                // Create the HTML that links to the video
                var text = "<a class='youtubeURL' href='#' title='" + url + "' >" + title + "</a>" +
                    "<p>Published: " + datepublished + " by " + author + "</p><br>";

                // Append string to the div for display
                $("#youtube").append(text);
            });

            $("a").click(function() {
                $("#video").html("");
                // Get the URL for the link that was clicked
                var url = "//www.youtube.com/embed/" + $(this).attr("title");
                var text = " <iframe width='100%' height='550px' " +
                    " src= '" + url + "?autoplay=1'>" +
                    "</iframe>";
                // Append string to div for display
                $("#video").append(text);
                goToByScroll('#video');
            });
        });

        // $('#youtubeDisplay').show();
        // goToByScroll('#youtubeDisplay');
    });

    $("#btnTwitter").click(function() {
        generateTwitterSearchID($('#subDropDown').find(":selected").val().toUpperCase());
    })

    $("#btnEmergency").click(function() {
        placesHospitals();
    });
    $('#btnCharts').click(function() {
        plotGraphFilter($('#dropDown').find(":selected").val().toUpperCase(), $('#subDropDown').find(":selected").val().toUpperCase());
    });
    /* ========================================================================= */
    /*  Menu item highlighting
    /* ========================================================================= */

    jQuery('#nav').singlePageNav({
        offset: jQuery('#nav').outerHeight(),
        filter: ':not(.external)',
        speed: 1200,
        currentClass: 'current',
        easing: 'easeInOutExpo',
        updateHash: true,
        beforeStart: function() {
            //console.log('begin scrolling');
        },
        onComplete: function() {
            //console.log('done scrolling');
        }
    });

    $(window).scroll(function() {
        if ($(window).scrollTop() > 400) {
            $("#navigation").css("background-color", "#0EB493");
        } else {
            $("#navigation").css("background-color", "rgba(16, 22, 54, 0.2)");
        }
    });

    /* ========================================================================= */
    /*  Fix Slider Height
    /* ========================================================================= */

    var slideHeight = $(window).height();

    $('#slider, .carousel.slide, .carousel-inner, .carousel-inner .item').css('height', slideHeight);

    $(window).resize(function() {
        'use strict',
        $('#slider, .carousel.slide, .carousel-inner, .carousel-inner .item').css('height', slideHeight);
    });


    /* ========================================================================= */
    /*  Portfolio Filtering
    /* ========================================================================= */


    // portfolio filtering

    $(".project-wrapper").mixItUp();


    $(".fancybox").fancybox({
        padding: 0,

        openEffect: 'elastic',
        openSpeed: 650,

        closeEffect: 'elastic',
        closeSpeed: 550,

        closeClick: true,
    });

    /* ========================================================================= */
    /*  Parallax
    /* ========================================================================= */

    $('#facts').parallax("50%", 0.3);

    /* ========================================================================= */
    /*  Timer count
    /* ========================================================================= */

    "use strict";
    $(".number-counters").appear(function() {
        $(".number-counters [data-to]").each(function() {
            var e = $(this).attr("data-to");
            $(this).delay(6e3).countTo({
                from: 50,
                to: e,
                speed: 3e3,
                refreshInterval: 50
            })
        })
    });

    /* ========================================================================= */
    /*  Back to Top
    /* ========================================================================= */


    $(window).scroll(function() {
        if ($(window).scrollTop() > 400) {
            $("#back-top").fadeIn(200)
        } else {
            $("#back-top").fadeOut(200)
        }
    });
    $("#back-top").click(function() {
        $("html, body").stop().animate({
            scrollTop: 0
        }, 1500, "easeInOutExpo")
    });
});

//UFO filters based on Shape and Country
function changeFilter(value) {
    var catOptions = "";
    filter = value;
    if (value.length == 0)
        document.getElementById("subDropDown").innerHTML = "<option></option>";
    else if (value == "country") {
        for (subDropDownId in dropDownList[value]) {
            catOptions += "<option value=" + dropDownList["countryVal"][subDropDownId] + " > " + dropDownList[value][subDropDownId] + "</option>";
        }
        document.getElementById("subDropDown").innerHTML = catOptions;

    } else {
        for (subDropDownId in dropDownList[value]) {
            catOptions += "<option value=" + dropDownList[value][subDropDownId] + " > " + dropDownList[value][subDropDownId] + "</option>";
        }
        document.getElementById("subDropDown").innerHTML = catOptions;
    }
}

function plotShapeBasedUFOs(shape) {
    $.each(sightingsArray, function(index, UFO) {
        var mylatlong = {
            lat: UFO.latitude,
            lng: UFO.longitude
        };
        if (UFO.shape.toUpperCase() == shape.toUpperCase()) {
            var marker = new google.maps.Marker({
                position: mylatlong,
                icon: icons[UFO.shape.toUpperCase()].icon,
                map: map,
                title: UFO.shape
            });

            marker.addListener('click', function(event) {
                populateInfoPane(UFO);
                analyzeRisk(marker);
                $("#infoPane").css("display", "block");
            });

            var infowindowWeather;
            marker.addListener('mouseover', function(event) {
                populateWeatherInfos(UFO.city, UFO.state, weatherContent);
                //alert("weatherContent : "+weatherContent);
                infowindowWeather = new google.maps.InfoWindow({
                    content: weatherContent
                });
                infowindowWeather.open(map, marker);
            });
            marker.addListener('mouseout', function(event) {
                infowindowWeather.close();
            });
        }
    });
}

function plotCountryBasedUFOs(country) {
    $.each(sightingsArray, function(index, UFO) {
        var mylatlong = {
            lat: UFO.latitude,
            lng: UFO.longitude
        };
        if (UFO.country.toUpperCase() == country.toUpperCase()) {
            var marker = new google.maps.Marker({
                position: mylatlong,
                icon: icons[UFO.shape.toUpperCase()].icon,
                map: map,
                title: UFO.shape
            });

            marker.addListener('click', function(event) {
                populateInfoPane(UFO);
                analyzeRisk(marker);
                $("#infoPane").css("display", "block");
            });

            var infowindowWeather;
            marker.addListener('mouseover', function(event) {
                populateWeatherInfos(UFO.city, UFO.state, weatherContent);
                //alert("weatherContent : "+weatherContent);
                infowindowWeather = new google.maps.InfoWindow({
                    content: weatherContent
                });
                infowindowWeather.open(map, marker);
            });
            marker.addListener('mouseout', function(event) {
                infowindowWeather.close();
            });
        }
    });
}

function goToByScroll(id) {
    $('html,body').animate({ scrollTop: $(id).offset().top }, 'slow');
}

// ==========  START GOOGLE MAP ========== //
function initMap() {
    var mapCanvas = document.getElementById("map_canvas");
    var mapOptions = { zoom: 4, mapTypeControl: false, fullscreenControl: false };
    map = new google.maps.Map(mapCanvas, mapOptions);
    setZoomAtCurrentLocation();

    var infoWindow = new google.maps.InfoWindow({
        content: "Cylinder" + " UFO occured at" + " 10/10/1949 20:30"
    });

    google.maps.event.addListener(map, 'click', function(event) {
        currentLat = event.latLng.lat();
        currentLng = event.latLng.lng();
        //$("#infoPane").css("display","none");
        $(".modalInfoPane").css("display", "none");
    });
    //    plotSightingMarkers();
}

function plotSightingMarkers() {
    $.getJSON("datasource/pinesh.json", function(data) {
        sightingsArray = data.Sightings;
        var latlng = "";
        $.each(sightingsArray, function(index, sighting) {
            latlng = { lat: sighting.latitude, lng: sighting.longitude };
            dictLatLong.push(latlng);
            var plotMarker = new google.maps.Marker({
                position: latlng,
                animation: google.maps.Animation.DROP,
                icon: icons[sighting.shape.toUpperCase()].icon,
                map: map,
                title: sighting.shape
            });

            var infowindow = new google.maps.InfoWindow({
                content: "<p>hey!</p>"
            });

            plotMarker.addListener('click', function(event) {
                populateInfoPane(sighting);
                analyzeRisk(plotMarker);
                $("#infoPane").css("display", "block");
                emergencyMarkerClick = plotMarker;
                //placesHospitals(plotMarker);
                //$('#hospitalsDisplay').show();
            });

            var infowindowWeather;
            plotMarker.addListener('mouseover', function(event) {
                populateWeatherInfos(sighting.city, sighting.state, weatherContent);
                //alert("weatherContent : "+weatherContent);
                infowindowWeather = new google.maps.InfoWindow({
                    content: weatherContent
                });
                infowindowWeather.open(map, plotMarker);

            });
            plotMarker.addListener('mouseout', function(event) {
                infowindowWeather.close();
            });
        });
    });
}

function setZoomAtCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            currentLat = position.coords.latitude;
            currentLng = position.coords.longitude;
            myCoordinates = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            //console.log("COORDINATES--"+position.coords.latitude+"--"+position.coords.longitude);
            var youAreHereMarker = new google.maps.Marker({
                position: myCoordinates,
                map: map,
                animation: google.maps.Animation.BOUNCE,
                title: "You are here!"
            });
            dataContent = "<p>You are here!</p>";
            var infowindow = new google.maps.InfoWindow({
                content: dataContent
            });
            map.setCenter(myCoordinates);
        });
    } else
        handleLocationError(false, infoWindow, map.getCenter());
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'svgfiles support geolocation.');
    infoWindow.open(map);
}

function populateInfoPane(sighting) {
    $("#shape").val(sighting.shape);
    $("#datetimeOccurence").val(sighting.datetime);
    $("#duration").val(sighting.duration_seconds);
    $("#reportPostedOn").val(sighting.date_posted);
    $("#comment").text(sighting.comments);
}
/*
function initialize() {
    var myLatLng = new google.maps.LatLng(22.402789, 91.822156);

    var mapOptions = {
        zoom: 14,
        center: myLatLng,
        disableDefaultUI: true,
        scrollwheel: false,
        navigationControl: false,
        mapTypeControl: false,
        scaleControl: false,
        draggable: false,
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'roadatlas']
        }
    };

    var map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);


    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        icon: 'img/location-icon.png',
        title: '',
    });

}

google.maps.event.addDomListener(window, "load", initialize);*/
// ========== END GOOGLE MAP ========== //

// ========== START Risk Analyzer (UFOs analyzed for a radius of 3000km) ========== //
function analyzeRisk(plotMarker) {
    var colour = "";
    var msg = "";
    var ufoCount = 0;
    $.each(dictLatLong, function(index, x) {
        //alert("analyze"+plotMarker.getPosition().lat()+"-"+ plotMarker.getPosition().lng());
        var clickedCoordinate = new google.maps.LatLng(plotMarker.getPosition().lat(), plotMarker.getPosition().lng());
        var curr = new google.maps.LatLng(x.lat, x.lng);
        var distanceInMetres = google.maps.geometry.spherical.computeDistanceBetween(curr, clickedCoordinate);

        /*console.log("curr:::: "+plotMarker.getPosition().lat()+"-"+ plotMarker.getPosition().lng());
         console.log("surrounding UFOs:::: "+x.lat+"-"+ x.lng);
         console.log("distanceInMetres is : "+distanceInMetres);*/

        //in the radius of less than 3000km
        if (distanceInMetres < 3000000 && distanceInMetres > 0)
            ufoCount++;
    });
    //console.log("count is : "+ufoCount);
    if (ufoCount == 0) {
        colour = "#2dc937";
        msg = "RISK LEVEL: Safe!";
    } else if (ufoCount > 0 && ufoCount <= 5) {
        colour = "#e7b416";
        msg = "RISK LEVEL: Moderate Unsafe!";
    } else if (ufoCount > 5) {
        colour = "#cc3232";
        msg = "RISK LEVEL: Unsafe!";
    }
    $("#riskLevel").css('background-color', colour);
    $("#riskMsg").text(msg);
}
// ========== END Risk Analyzer (UFOs analyzed for a radius of 3000km) ========== //

// ========== START YOUTUBE ========== //
function initYT() {
    gapi.client.setApiKey("AIzaSyA-iNH1KxjrmLNcvkelu6X-thApHPHiQbs");
    gapi.client.load("youtube", "v3", function() {
        // yt api is ready
        //console.log('yt apiready');
    });
}
// ========== END YOUTUBE ========== //

// ========== START FLICKR ========== //
function populateFlickrPhotos(photoHashtag) {
    console.log(photoHashtag);
    $("#flickrPhotos").empty();
    //by hashtag
    var hashtag = "ufo"+photoHashtag;
    $.getJSON('http://api.flickr.com/services/feeds/photos_public.gne?tags=' + hashtag + "&tagmode=any&format=json&jsoncallback=?",
        function(data) {
            $("#images").hide().html(data).fadeIn('fast');
            $.each(data.items, function(i, item) {
                console.log(item);
                $("<img/>").attr("src", item.media.m).appendTo("#flickrPhotos");
            });
        });
    //by search term
    $(function() {
        var opts = {
            method: 'flickr.photos.search',
            api_key: '469de2992d33cc6e9353b1aeb4f71f86',
            sort: 'relevance',
            text: photoHashtag + " UFO",
            extras: 'url_m',
            per_page: 10,
            format: 'json',
            nojsoncallback: 1
        };
        $.get('https://api.flickr.com/services/rest/', opts, function(resp) {
            if (resp.stat === "ok") {
                $.each(resp.photos.photo, function(index, value) {

                    $("<img/>").attr({
                        class: "mix work-item branding",
                        src: value.url_m,
                        title: value.title
                    }).appendTo("#flickrPhotos");
                });
            } else {
                console.log('not ok', resp);
            }
        });
    });
    $("#flickrPhotos").prepend('<img src="img/works/u1.jpg" />')
    $("#flickrPhotos").prepend('<img src="img/works/u2.jpg" />')
    $("#flickrPhotos").prepend('<img src="img/works/u3.jpg" />')
    $("#flickrPhotos").prepend('<img src="img/works/u4.jpg" />')
}
// ========== END FLICKR ========== //

// ========== START TWITTER ========== //
function generateTwitterSearchID(searchKeyword) {
    var tweet_ID;
    switch (searchKeyword) {
        case 'CYLINDER':
            tweet_ID = '896045685220495360';
            break;
        case 'LIGHT':
            tweet_ID = '896046264785260544';
            break;
        case 'CIRCLE':
            tweet_ID = '896046499158798397';
            break;
        case 'SPHERE':
            tweet_ID = '896047086935961600';
            break;
        case 'DISK':
            tweet_ID = '896047283019689990';
            break;
        case 'FIREBALL':
            tweet_ID = '896033199314415617';
            break;
        case 'OVAL':
            tweet_ID = '896047495385669634';
            break;
        case 'CIGAR':
            tweet_ID = '896047735828303872';
            break;
        case 'RECTANGLE':
            tweet_ID = '896047937473720324';
            break;
        case 'CHEVRON':
            tweet_ID = '896049187091034113';
            break;
        case 'TRIANGLE':
            tweet_ID = '896049378519023616';
            break;
        case 'FORMATION':
            tweet_ID = '896049626901606401';
            break;
        case 'DELTA':
            tweet_ID = '896049824713388035';
            break;
        case 'EGG':
            tweet_ID = '896050042666201088';
            break;
        case 'FLASH':
            tweet_ID = '896050202305605634';
            break;
        case 'DIAMOND':
            tweet_ID = '896050366957182976';
            break;
        case 'TEARDROP':
            tweet_ID = '896398404527566848'
            break;
        case 'CONE':
            tweet_ID = '896398717053480961';
            break;
        case 'CROSS':
            tweet_ID = '896050621165572096';
            break;
        case 'PYRAMID':
            tweet_ID = '896050779244687360';
            break;
        case 'ROUND':
            tweet_ID = '896050933574119424';
            break;
        case 'CRESCENT':
            tweet_ID = '896051153435340804';
            break;
        case 'FLARE':
            tweet_ID = '896051316551766016';
            break;
        case 'HEXAGON':
            tweet_ID = '896051457660792833';
            break;
        case 'DOME':
            tweet_ID = '896051719855124480';
            break;
        case 'CA': //canada
            tweet_ID = '896037875212582912';
            break;
        case 'GB': //uk
            tweet_ID = '896038975323983872';
            break;
        case 'US': //america
            tweet_ID = '896041002787647489';
            break;
        case 'AU': //australia
            tweet_ID = '896043741689020416';
            break;
        case 'DE': //germany
            tweet_ID = '896044171542368256';
            break;
        default:
            tweet_ID = '896036590983798784';
            break;
    }
    document.getElementById("twitter").innerHTML = "";
    document.getElementById("twitter").innerHTML = '<a class="twitter-timeline" data-widget-id=' + tweet_ID + ' />';
}
window.twttr = (function(d, s, id) {

    var t, js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://platform.twitter.com/widgets.js";
    fjs.parentNode.insertBefore(js, fjs);

    return window.twttr || (t = { _e: [], ready: function(f) { t._e.push(f) } });

}(document, "script", "twitter-wjs"));
twttr.ready(function(twttr) {

    twttr.widgets.load();
    setInterval(function() {
        twttr.widgets.load();
    });

});
// ========== END TWITTER ========== //
//
// ========== START WEATHER ========== //
function populateWeatherInfos(city, state) {
    var weatherGenerated = "";
    var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                //console.log(xmlhttp.responseText);
                var conditions = JSON.parse(xmlhttp.responseText);
                //console.log(conditions);

                weatherGenerated = '<p><a target="_blank" style="text-decoration: snow" href="' + conditions.current_observation.forecast_url + '">' +
                    conditions.current_observation.display_location.full + '</a></p>' +
                    '<div style="float: left"><p><img src="' + conditions.current_observation.icon_url + '">' +
                    '<br/>' + conditions.current_observation.icon + '' + '</p></div>' +
                    '<div style="float: left;margin-left: 20px;margin-right: 20px"><p><a style="color: red;font-size: 17px;">' +
                    conditions.current_observation.temp_c + ' &deg;C' + '</a><br/>' +
                    'feels like : ' + conditions.current_observation.feelslike_c + ' &deg;C' + '</p></div>' +
                    '<div style="clear: both"><p>' + 'Elev ' + conditions.current_observation.display_location.elevation + ' m,' +
                    '  ' + conditions.current_observation.display_location.latitude.substring(0, 7) + ' , ' +
                    conditions.current_observation.display_location.longitude.substring(0, 7) + '</p>' +
                    '<p>' + conditions.current_observation.local_time_rfc822.substring(0, 26) + '</p></div>';

                //console.log("weatherGenerated:"+weatherGenerated);
                weatherContent = weatherGenerated;
            }
        }
    }
    city = city.replace(" ", "_");
    var v = "http://api.wunderground.com/api/8078b0b9d503c443/conditions/q/" + state + "/" + city + ".json";
    //var v = "http://api.wunderground.com/api/8078b0b9d503c443/geolookup/q/37.776289,-122.395234.json";
    xmlhttp.open("get", v);
    xmlhttp.send(null);
    //alert("--"+weatherGenerated);
}
// ========== END WEATHER ========== //

// ========== START GOOGLE PLACES for Hostpitals ========== //
function placesHospitals() {
    var currLoc = {
        lat: currentLat,
        lng: currentLng
    };
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch({
        location: currLoc,
        radius: 3000,
        type: ['hospital']
    }, callback);

    map.setCenter(myCoordinates);
}

function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
    }
}

function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        icon: icons["hospital"].icon,
        map: map,
        position: place.geometry.location
    });
}
// ========== END GOOGLE PLACES for Hostpitals ========== //

// ========== START GOOGLE CHARTS ========== //
function plotGraphFilter(filter1, filter2) {
    switch (filter1) {
        case 'SELECT':
            plotDefaultGraph();
            break;
        case 'SHAPE':
            switch (filter2) {
                case 'CYLINDER':
                case 'LIGHT':
                case 'CIRCLE':
                case 'SPHERE':
                case 'DISK':
                case 'FIREBALL':
                case 'OVAL':
                case 'CIGAR':
                case 'RECTANGLE':
                case 'CHEVRON':
                case 'TRIANGLE':
                case 'FORMATION':
                case 'DELTA':
                case 'EGG':
                case 'FLASH':
                case 'DIAMOND':
                case 'TEARDROP':
                case 'CONE':
                case 'CROSS':
                case 'PYRAMID':
                case 'ROUND':
                case 'CRESCENT':
                case 'FLARE':
                case 'HEXAGON':
                case 'DOME':
                case 'OTHERS':
                    plotGeoChart(filter2);
                    break;
                default:
                    plotDefaultShapeGraph();
                    break;
            }
            break;
        case 'COUNTRY':
            switch (filter2) {
                case "US":
                case "CA":
                case "GB":
                case "AU":
                case "DE":
                    plotLineChart(filter2.toUpperCase());
                    break;
                default:
                    plotDefaultGraph();
            }
            break;
        default:
            plotDefaultGraph();
            break;
    }
}

function plotLineChart(countryName) {
    var lineChartArray = [];
    lineChartArray[0] = [];
    lineChartArray[0].push('Year');
    lineChartArray[0].push('Light');
    lineChartArray[0].push('Circle');
    lineChartArray[0].push('Sphere');
    lineChartArray[0].push('Disc');
    lineChartArray[0].push('Round');
    var cntLight = [];
    var cntCircle = [];
    var cntSphere = [];
    var cntDisc = [];
    var cnRound = [];
    cntLight[0] = 0;
    cntLight[1] = 0;
    cntLight[2] = 0;
    cntCircle[0] = 0;
    cntCircle[1] = 0;
    cntCircle[2] = 0;
    cntSphere[0] = 0;
    cntSphere[1] = 0;
    cntSphere[2] = 0;
    cntDisc[0] = 0;
    cntDisc[1] = 0;
    cntDisc[2] = 0;
    cnRound[0] = 0;
    cnRound[1] = 0;
    cnRound[2] = 0;
    $.each(sightingsArray, function(index, s) {
        var str = "";
        var cn = s.country.toUpperCase()
        if (cn == "") {
            str = s.city.toUpperCase();
            var tstr = '/' + countryName + '/g';
            if (str.match(tstr) == countryName) {
                cn = str.match(tstr);
            }
        }
        if (cn == countryName) {
            var y = s.datetime.substring(s.datetime.lastIndexOf('/') + 1, s.datetime.lastIndexOf('/') + 5)
            switch (s.shape.toUpperCase()) {
                case 'LIGHT':
                    if (y < 1975) {
                        cntLight[0]++;
                    } else if (y >= 1975 && y < 1995) {
                        cntLight[1]++;
                    } else {
                        cntLight[2]++;
                    }
                    break;
                case 'CIRCLE':
                    if (y < 1975) {
                        cntCircle[0]++;
                    } else if (y >= 1975 && y < 1995) {
                        cntCircle[1]++;
                    } else {
                        cntCircle[2]++;
                    }
                    break;
                case 'SPHERE':
                    if (y < 1975) {
                        cntSphere[0]++;
                    } else if (y >= 1975 && y < 1995) {
                        cntSphere[1]++;
                    } else {
                        cntSphere[2]++;
                    }
                    break;
                case 'DISC':
                    if (y < 1975) {
                        cntDisc[0]++;
                    } else if (y >= 1975 && y < 1995) {
                        cntDisc[1]++;
                    } else {
                        cntDisc[2]++;
                    }
                    break;
                case 'ROUND':
                    if (y < 1975) {
                        cnRound[0]++
                    } else if (y >= 1975 && y < 1995) {
                        cnRound[1]++
                    } else {
                        cnRound[2]++;
                    }
                    break;
            }
        }
    });
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        var data = google.visualization.arrayToDataTable([
            ['Year', 'Light', 'Circle', 'Sphere', 'Disc', 'Round', ],
            ['1949', cntLight[0], cntCircle[0], cntSphere[0], cntDisc[0], cnRound[0]],
            ['1975', cntLight[1], cntCircle[1], cntSphere[1], cntDisc[1], cnRound[1]],
            ['2013', cntLight[2], cntCircle[2], cntSphere[2], cntDisc[2], cnRound[2]],
        ]);
        var options = {
            title: 'Yearly occurrences of various UFOs in ' + countryName,
            curveType: 'function',
            width: $(window).width()*0.35,
            height: $(window).height()*0.25,
            legend: { position: 'bottom' }
        };
        var chart = new google.visualization.LineChart(document.getElementById('googleCharts'));
        chart.draw(data, options);
        //displayModalWindow();
    }
}

function plotGeoChart(shapeType) {
    var usCount = 0;
    var caCount = 0;
    var gbCount = 0;
    var auCount = 0;
    var jaCount = 0;
    $.each(sightingsArray, function(index, s) {
        if (s.shape.toUpperCase() == shapeType) {
            switch (s.country.toUpperCase()) {
                case 'US':
                    usCount++;
                    break;
                case 'GB':
                    gbCount++;
                case '':
                case ' ':
                default:
                    var str = s.city.toUpperCase();
                    if (str.match(/CANADA/g) == "CANADA") {
                        caCount++;
                    } else if (str.match(/AUSTRALIA/g) == "AUSTRALIA") {
                        auCount++;
                    } else if (str.match(/JAPAN/g) == "JAPAN") {
                        jaCount++;
                    }
                    break;
            }
        }
    });
    google.charts.load('current', {
        'packages': ['geochart'],
        'mapsApiKey': 'AIzaSyCkivn5BLIdpVpcScj2g8vX84_xmdNxDks'
    });
    google.charts.setOnLoadCallback(drawRegionsMap);

    function drawRegionsMap() {
        var data = google.visualization.arrayToDataTable([
            ['Country', 'Sightings with ' + shapeType + ' shape'],
            ['GB', gbCount],
            ['United States', usCount],
            ['Canada', caCount],
            ['Japan', jaCount],
            ['Australis', auCount]
        ]);
        var options = {
            width: $(window).width()*0.35,
            height: $(window).height()*0.25,
            magnifyingGlass: { enable: true, zoomFactor: 7.5 }
        };
        var chart = new google.visualization.GeoChart(document.getElementById('googleCharts'));
        chart.draw(data, options);
        //displayModalWindow();
    }
}

function plotDefaultShapeGraph() {
    var cntLight = 0;
    var cntCircle = 0;
    var cntSphere = 0;
    var cntDisk = 0;
    var cntFireball = 0;
    var cntOval = 0;
    var cntTriangle = 0;
    var cntDelta = 0;
    var cntPyramid = 0;
    var cntRound = 0;
    var cntCrescent = 0;
    var cntFlare = 0;
    var cntHexagon = 0;
    var cntDome = 0;
    var cntOthers = 0;
    var shapeSightings = [];
    $.each(sightingsArray, function(index, s) {
        switch (s.shape.toUpperCase()) {
            case 'LIGHT':
                cntLight++;
                break;
            case 'CIRCLE':
                cntCircle++;
                break;
            case 'SPHERE':
                cntSphere++;
                break;
            case 'DISK':
                cntDisk++;
                break;
            case 'FIREBALL':
                cntFireball++;
                break;
            case 'OVAL':
                cntOval++;
                break;
            case 'TRIANGLE':
                cntTriangle++;
                break;
            case 'DELTA':
                cntDelta++;
                break;
            case 'PYRAMID':
                cntPyramid++;
                break;
            case 'ROUND':
                cntRound++;
                break;
            case 'CRESCENT':
                cntCrescent++;
                break;
            case 'FLARE':
                cntFlare++;
                break;
            case 'HEXAGON':
                cntHexagon++;
                break;
            case 'DOME':
                cntDome++;
                break;
            default:
                cntOthers++;
                break;
        }
    });
    google.charts.load('current', {
        'packages': ['corechart']
    });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        var data = google.visualization.arrayToDataTable([
            ['Shape', 'Number of sightings'],
            ['Light', cntLight],
            ['Circle', cntCircle],
            ['Sphere', cntSphere],
            ['Disk', cntDisk],
            ['Fireball', cntFireball],
            ['Oval', cntOval],
            ['Triangle', cntTriangle],
            ['Delta', cntDelta],
            ['Pyramid', cntPyramid],
            ['Round', cntRound],
            ['Crescent', cntCrescent],
            ['Flare', cntFlare],
            ['Hexagon', cntHexagon],
            ['Dome', cntDome],
            ['Others', cntOthers]
        ]);
        var options = {
            title: 'Shape based analysis',
            is3D: true,
            width: $(window).width()*0.35,
            height: $(window).height()*0.25,
            chartArea: { left: 50, top: 50, width: '100%', height: '100%' },
            backgroundColor: '#ABEBC6'
        };
        var chart = new google.visualization.PieChart(document.getElementById('googleCharts'));
        chart.draw(data, options);
        //displayModalWindow();
    }
}

function plotDefaultGraph() {
    var usCount = 0;
    var caCount = 0;
    var gbCount = 0;
    var auCount = 0;
    var deCount = 0;
    var year = [];
    $.each(sightingsArray, function(index, s) {
        year.push(s.datetime.substring(s.datetime.lastIndexOf('/') + 1, s.datetime.lastIndexOf('/') + 5));
    });
    var noDupliYear = [];
    noDupliYear.push(year[0]);
    for (var i = 1; i < year.length; i++) {
        var found = false;
        for (var j = 0; j < noDupliYear.length; j++) {
            if (year[i] == noDupliYear[j]) {
                found = true;
                break;
            }
        }
        if (!found) {
            noDupliYear.push(year[i]);
        }
    }
    noDupliYear.sort();
    var even = true;
    var arrylength = noDupliYear.length;
    var div = 3;
    if (arrylength % 2 != 0) {
        arrylength++;
        even = false;
    }
    var xaxisparts = arrylength / div;
    var j = 0;
    var yearPartition = [];
    yearPartition[0] = ['Year', 'America', 'UK', 'Canada', 'Australia', 'Germany'];
    for (var i = 0; i < div; i++) {
        if (i == div - 1 && !even) {
            xaxisparts--;
        }
        var strStr = noDupliYear[j] + '-' + noDupliYear[j + xaxisparts - 1];
        yearPartition[i + 1] = [];
        yearPartition[i + 1].push(strStr);
        $.each(sightingsArray, function(index, s) {
            var y = s.datetime.substring(s.datetime.lastIndexOf('/') + 1, s.datetime.lastIndexOf('/') + 5);
            if (y >= noDupliYear[j] && y <= noDupliYear[j + xaxisparts - 1]) {
                switch (s.country.toUpperCase()) {
                    case "US":
                        usCount++;
                        break;
                    case "CA":
                        caCount++;
                        break;
                    case "GB":
                        gbCount++;
                        break;
                    case "AU":
                        auCount++;
                        break;
                    case "DE":
                        deCount++;
                        break;
                }
            }
        });
        yearPartition[i + 1].push(usCount);
        yearPartition[i + 1].push(gbCount);
        yearPartition[i + 1].push(caCount);
        yearPartition[i + 1].push(auCount);
        yearPartition[i + 1].push(deCount);
        usCount = 0;
        gbCount = 0;
        caCount = 0;
        auCount = 0;
        deCount = 0;
        j += xaxisparts;
    }
    console.log(yearPartition);
    google.charts.load('current', {
        'packages': ['bar']
    });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        var data = google.visualization.arrayToDataTable(yearPartition);
        var options = {
            backgroundColor: '#ABEBC6',
            width: $(window).width()*0.35,
            height: $(window).height()*0.25,
            animation: {
                duration: 1000,
                easing: 'inAndOut',
            },
            chart: {
                title: 'UFO sightings',
                subtitle: 'Year wise UFO sigthings in countries: ' + noDupliYear[0] + '-' + noDupliYear[noDupliYear.length - 1],
            },
            bars: 'verticle' // Required for Material Bar Charts.
        };
        var chart = new google.charts.Bar(document.getElementById('googleCharts'));
        chart.draw(data, google.charts.Bar.convertOptions(options));
        //displayModalWindow();
    }
}
// ========== END GOOGLE CHARTS ========== //
