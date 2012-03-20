/**
 * jQuery.MediaAlignedTextEditor
 * Copyright (c) 2012 J. Reuben Wetherbee - jreubenwetherbee(at)gmail(dot)com
 * Licensed under MIT
 *
 * @projectDescription Handles the editing of the alignment of MediaFiles along with aligned text
 * 
 * @todo more documentation needed
 */

(function( $ ) {
    
    /**
     * base JQuery function to handle public method calls
     */
    $.fn.mediaAlignedTextEditor = function( method ) {
        //call specific method and pass along additional arguments
        if(public_methods[method]) {
            return public_methods[method].apply(this, Array.prototype.slice.call( arguments, 1));
        }
        //default to init method if no method specified
        if ( typeof method === 'object' || ! method ) {
            
            return public_methods.init.apply( this, arguments );
        }
        //method not recognized
        else {
            $.error( 'Method ' +  method + ' does not exist in jQuery.mediaAlignedTextEditor' );
        }
    };
    
    
    /**
     * Define the following public methods
     * - clearAlignment       Remove all segment and time alignment
     * - init                 Initialize the MediaAlignedText
     * - initMediaText        Create new text encoded json_alignment based upon passed in plain text
     * - outputAlignment      Output the current alignment
     * - pauseManualAlignment Pause the manual alignment that is currently being recorded
     * - playCurrentSegment   Play the currentlu selected segment via the player
     * - recordManualTime     called when user clicks button to record time
     * - saveManualAlignment  save the manual alignment that has been recorded
     * - startManualAlignment start the recording for manual alignment
     * - timeSegmentClicked   Handles when user clicks on a particular time segment
     * - updateMedia          Handles changing the Media file referenced
     * - updateSegmentTime    Handles updating the text segment start and end parameters
     * - zoomTimeEditor       zoom the time editor in or out
     */
    var public_methods = {

         /**
          * clears the timing for segments by setting the start_time and end time to -1
          * 
          * @param Integer text_segment_index_start   The index at which to start clearing the alignment (default 0)
          * @param Integer text_segment_index_end     The index at which to stop clearing the alignment (default last index)
          */
        'clearAlignment' : function(text_segment_index_start, text_segment_index_end) {
            //get handles to jQuery object and data
            var $this = $(this);
            var data = $this.data('mediaAlignedText');
            
            //set defaults
            if(text_segment_index_start == undefined) {
                text_segment_index_start = 0;
            }
            
            if(text_segment_index_end == undefined) {
                text_segment_index_end = data.text_segments.length - 1;
            }
            
            for(i = text_segment_index_start; i <= text_segment_index_end; i++) {
                data.text_segments[i].time_start = -1;
                data.text_segments[i].time_end = -1;
            }
            
            //save data back to the object
            $this.data('mediaAlignedText', data);
        }, 
        
        /**
         * Initialize the editor
         * @param options
         */
        'init' : function(options){
            //save options to the objects namespaced data holder
            var $this = $(this);
            var data = $this.data('mediaAlignedTextEditor');
            
            //get default options 
            var options = $.extend({
                'editor_css_selector'       : '#mat_editor',
                'media_files'               : {},                    //media files to be aligned
                'viewable_media_segments'   : 5, //average number of segments viewable on the viewer
                'color_toggle_classes'      : ['mat_toggle_bg_color_0', 'mat_toggle_bg_color_1', 'mat_toggle_bg_color_2', 'mat_toggle_bg_color_3'], //array of classes to toggle through
                'highlight_function'        : _textSegmentHighlight, //the function to use to highlight - requires object and text_segment_index as arguments
                'highlight_remove_function' : _textSegmentRemoveHighlight  //function to remove highligh - requires object and text_segment_index as arguments
            }, options);

            
            //if data not yet initialized set here
            if(!data) {
                data = {
                    'viewable_media_segments' : options.viewable_media_segments,
                    'color_toggle_classes' : options.color_toggle_classes,
                    'highlight_function': options.highlight_function,
                    'highlight_remove_function': options.highlight_remove_function
                };
                $this.data('mediaAlignedTextEditor', data);
            }
            
            //initialize the player
            $this.mediaAlignedText(options);
            
            _initTimeEditor($this);
            
        },
        

        /**
         * Create html hyperaudio markup from plain text 
         * 
         * @param text_string   The string of the text to be parsed
         * @param break_on      The type of textual element to break
         * @param tag           The tag to mark the segments with (defaults to 'span')
         */
        'initMediaText' : function(options) {
            var $this = $(this);
            var data = $this.data('mediaAlignedText');

            var options = $.extend({
                'media_file_type'           : 'mp3',  //type of media file
                'text_init_type'            : 'WORD', //what to break on (can be WORD, LINE, SENTENCE, STANZA, TAGGED(already tagged)
                'tag'                       : 'span', // the tag to enclose the text segments in
                'url'                       : '', //url of the media file
                'duration'                  : 0, //duration in milliseconds of the media file
                'text'                      : '' //the text to align
                }, options);
            
            if(options.text_init_type == 'TAGGED') {
                $(data.text_viewer_css_selector).html(options.text);
            }
            else {
                if(options.tag == undefined) tag = 'span';
                
                switch(options.text_init_type)
                {
                case 'WORD':
                    var pattern = new RegExp(/(\s+)/);
                    break;
                case 'LINE':
                    var pattern = new RegExp(/(\n+)/);
                    break;
                case 'SENTENCE':
                    var pattern = new RegExp(/(\.|\?|!)/);
                    break;
                case 'STANZA':
                    var pattern = new RegExp(/(\n+)/);
                    break;
                default:
                    var pattern = new RegExp('(' + options.text_init_type + ')');
                }
                
                //split text on the pattern determined above
                var segments = options.text.split(pattern);
                
                //loop through text and 
                var html = '';
                for(i = 0; i < segments.length; i++) {
                    if(i % 2 == 0 && segments[i].match(/\w/)) {
                        html = html + '<' + options.tag  + ' ' + data.time_start_attribute + '="-1">' + segments[i] + '</' + options.tag + '>';
                    }
                    else {
                        html = html + segments[i];
                    }
                }
                
                //change line breaks to br tags
                html = html.replace(/\n/g, "<br />\n");
                
                $(data.text_viewer_css_selector).html(html);
            }
            
            var media_def = {'duration': parseFloat(options.duration), 'media' : {}};
            media_def.media[options.media_file_type] = options.url;
            
            //load the media file into the player and load to get the duration
            $this.jPlayer("setMedia", media_def.media);
            $this.jPlayer('play', 0);
            $this.jPlayer('pause');
           
            data.media_files[0] = media_def;
            
            $this.data('mediaAlignedText', data);
            
            //initialize the player
            $this.mediaAlignedText('refreshSegments');
            
            _initTimeEditor($this);
        },
        
        'outputAlignment' : function() {
            var $this = $(this);
            var data = $this.data('mediaAlignedText');
            var editor_data = $this.data('mediaAlignedTextEditor');
            var html = $(data.text_viewer_css_selector).html();
            
            //get rid of mat_segment data 
            html = html.replace(/ data-mat_segment="[0-9]+"/ig,'');
            
            //get rid of mat_text_segment class
            html = html.replace(/mat_text_segment/ig,'');
          
            //loop through color toggles and remove
            for(i in editor_data.color_toggle_classes) {
                var re = new RegExp(editor_data.color_toggle_classes[i],"g");
                html = html.replace(re,'');
            }
            
            //remove empty class declarations
            html = html.replace(/ class="\s*"/gi,'');
            
            //make sure br are properly encoded
            html = html.replace(/<br>/g, "<br />");
            
            $('#mat_output').val(html).show();

        },
        
        /**
         * Pause the manual alignment that is currently being recorded
         */
        'pauseManualAlignment' : function() {
            var $this = $(this);
            var editor_data = $this.data('mediaAlignedTextEditor');
            var current_time = Math.round(parseFloat($this.data("jPlayer").status.currentTime)*100)/100;

            //save the end position for the previous segment
            editor_data.manual_text_segment_alignment[editor_data.manual_text_segment_position].time_end = current_time;
            
            $this.jPlayer('pause');
        },
        
        /**
         * Play the current selected segment
         */
        'playCurrentSegment' : function() {
            var $this = $(this);
            
            $this.mediaAlignedText('playTextSegment', $this.data('mediaAlignedText').current_text_segment_index);
        },
        
        /**
         * Record the manual time for the current text segment and advance to the next one
         */
        'recordManualTime': function() {
            var $this = $(this);
            var editor_data = $this.data('mediaAlignedTextEditor');
            var current_time = Math.round(parseFloat($this.data("jPlayer").status.currentTime*1000));

            //save the end position for the previous segment
            editor_data.manual_text_segment_alignment[editor_data.manual_text_segment_position].time_end = current_time;
            
            //advance position and save the start time
            editor_data.manual_text_segment_position = editor_data.manual_text_segment_position + 1;
            editor_data.manual_text_segment_alignment[editor_data.manual_text_segment_position] = {
                'media_file_order': 0,
                'time_start': current_time
            };

            //unhighlight and highlight the selected word
            _textSegmentRemoveHighlight($this, $this.data('mediaAlignedText').current_text_segment_index);
            _textSegmentHighlight($this, editor_data.manual_text_segment_position);
            $this.data('mediaAlignedTextEditor', editor_data);
            
            console.log(current_time+': '+editor_data.manual_text_segment_position);
        },
        
        
        /**
         * Save the manual alignment that has been entered
         */
        'saveManualAlignment' : function() {
            var $this = $(this);
            var data = $this.data('mediaAlignedText');
            var editor_data = $this.data('mediaAlignedTextEditor');
            
            //loop throuh the recorded alingment data and update text_segment data
            for(var text_segment_index in editor_data.manual_text_segment_alignment) {
                var text_segment = data.text_segments[text_segment_index];
                if(text_segment != undefined) {
                    var manual_alignment = editor_data.manual_text_segment_alignment[text_segment_index];
                    var next_manual_alignment = editor_data.manual_text_segment_alignment[text_segment_index+1];
                    var adjusted_time = manual_alignment.time_start +50;
                    
                    //add the recorded values
                    text_segment.media_file_order = manual_alignment.media_file_order;
                    text_segment.time_start = manual_alignment.time_start;
                    
                    //if start_time and end_time the same, adjust slightly
                    if (manual_alignment.time_end <= manual_alignment.time_start) {
                        //shift end time later
                        manual_alignment.time_end = adjusted_time;
                        
                        //shift next start time later
                        if(editor_data.manual_text_segment_alignment[text_segment_index+1] != undefined) {
                            editor_data.manual_text_segment_alignment[text_segment_index+1].time_start = adjusted_time;
                        }
                    }
                    
                    //if end time is greater than next start time, adjust next start time to this end time
                    if(next_manual_alignment != undefined) {
                        if(manual_alignment.time_end > next_manual_alignment.time_start) {
                            editor_data.manual_text_segment_alignment[text_segment_index+1].time_start = adjusted_time;
                        }
                    }
                    
                    text_segment.time_end = manual_alignment.time_end;
                    
                    //save back to the data object
                    data.text_segments[text_segment_index] = text_segment;
                    
                    //update html
                    $(data.text_viewer_css_selector + ' [data-mat_segment=' + text_segment_index + ']')
                        .attr(data.time_start_attribute, text_segment.time_start)
                        .attr(data.time_end_attribute, text_segment.time_end);
                }
            }
            
            //save data object for persistence
            $this.data('mediaAlignedText', data);
            
            _initTimeEditor($this);
            
        },
        
        /**
         * Start recording manual alignment 
         * 
         * @param text_segment_index_start  text_segment on which to start the alignment
         * @param text_segment_index_start  text_segment on which to end the alignment
         * @param time_start
         * @param media_file_order_start
         */
        'startManualAlignment':  function(text_segment_index_start, text_segment_index_end, time_start, media_file_order_start) {
            var $this = $(this);
            var data = $this.data('mediaAlignedText');
            var editor_data = $this.data('mediaAlignedTextEditor');
            
            //add defaults if not set
            if(time_start == undefined) time_start = 0;
            if(text_segment_index_start == undefined) text_segment_index_start = 0;
            if(text_segment_index_end == undefined) text_segment_index_end = data.text_segments.length - 1;
            if(media_file_order_start == undefined) media_file_order_start = 0;
            
            //get the first text segment
            var text_segment = data.text_segments[text_segment_index_start];
            
            //set the editor position
            editor_data.manual_text_segment_position = text_segment_index_start;
            editor_data.manual_text_segment_alignment = {};
            editor_data.manual_text_segment_alignment[text_segment_index_start] = {'media_file_order': media_file_order_start, 'time_start': time_start};
            
            //clear the alignment data for the set 
            $this.mediaAlignedTextEditor('clearAlignment', text_segment_index_start, text_segment_index_end);
            
            //position the highlight at the first word
            _textSegmentHighlight($this, text_segment_index_start);
            
            //save data objects
            $this.data('mediaAlignedTextEditor', editor_data);
            
            //begin playing
            $this.jPlayer('play', time_start);
        },
        
        /**
         * Handles the click of a time segment
         * @param time_segment_div_id
         */
        'timeSegmentClicked' : function(time_segment_div_id) {
            var $this = $(this);
            var data = $this.data('mediaAlignedText');
            var editor_data = $this.data('mediaAlignedTextEditor');
            
            //strip the time_segment_ off of the div id to get the text_segment_index
            var text_segment_index = time_segment_div_id.replace('time_segment_','');
            var text_segment = data.text_segments[text_segment_index];
            
            //spoof clicking the char group
            $this.mediaAlignedText('textSegmentClicked', text_segment_index);
            
        },
        
        'updateMedia' : function(media_def, media_order) {
            var $this = $(this);
            var data = $this.data('mediaAlignedText');
            
            //load the media file into the player and load to get the duration
            $this.jPlayer("setMedia", {mp3: media_def.url});
            $this.jPlayer('play', 0);
            $this.jPlayer('pause');
            media_def.duration = $this.data('jPlayer').status.duration;
            
            if(media_order == undefined) media_order = 0;
            
            data.media_files[media_order].media[media_def.file_type] = media_def.url;
            
            $this.data('mediaAlignedText', data);
        },
        
        /**
         * 
         * @param Integer text_segment_index
         * @param Float   time_start
         * @param Float   time_end
         */
        'updateSegmentTime' : function(){
            var $this = $(this);
            var data = $this.data('mediaAlignedText');
            var text_segment_index = parseFloat(data.current_text_segment_index);
            var text_segment = data.text_segments[data.current_text_segment_index];
            var time_start = parseFloat($('#mat_editor_start_time').val()*1000);
            var time_end = parseFloat($('#mat_editor_end_time').val()*1000);
            var pre_segment = null;
            var post_segment = null;
            
            
            //check to make sure start is after end
            if(time_start >= time_end) {
                alert('The start time must be before the end time for this segment.');
                _setTimeSlider($this, text_segment_index);
                return $this;
            }
            
            //get the preceding segment
            if(text_segment_index > 0) {
                pre_segment = data.text_segments[text_segment_index -1];
                
                //check to make sure overlap doesn't occur
                if(time_start <= pre_segment.time_start) {
                    alert ('You may not set the start time of the segment before the start time of the preceding segment');
                    return $this;;
                }
            }
            
            //get the following segment
            if(text_segment_index < data.text_segments.length - 1) {
                post_segment = data.text_segments[text_segment_index + 1];
                
                //check to make sure overlap doesn't occur
                if(time_end >= post_segment.time_end) {
                    alert ('You may not set the end time of the segment after the end time of the following segment');
                    return $this;
                }
            }
            
            //update this time segment
            _updateSegmentTime($this, text_segment_index, time_start, time_end);
            
            //update preceding time segment;
            if(pre_segment !== null) {
                _updateSegmentTime($this, text_segment_index -1 , pre_segment.time_start, time_start);
            }
            
            //update following time segment;
            if(post_segment !== null) {
                _updateSegmentTime($this, text_segment_index  + 1, time_end, post_segment.time_end);
            }
         },
         

        
         
        /**
         * zoom into or out of the time editor
         * 
         * @param zoom_factor number indicating the amount of zoom in or out (>0 for zoom in <0 for zoom in)
         */
        'zoomTimeEditor' : function(zoom_factor) {
            var $this = $(this);
            var editor_data = $this.data('mediaAlignedTextEditor');
            var data = $this.data('mediaAlignedText');
            
            editor_data.viewable_media_segments = Math.ceil(Math.pow(2, zoom_factor)*editor_data.viewable_media_segments);
            
            //check to make sure haven't zoomed out too far
            if(editor_data.viewable_media_segments > data.text_segments.length) {
                editor_data.viewable_media_segments = data.text_segments.length;
            }
            $this.data('mediaAlingedTextEditor', editor_data);
            
            _initTimeEditor($this);
        }
    };
    
    
    /**
     * get the html for an individual time segment
     * 
     * @param JqueryObject  $this               the JqueryObject to manipulate
     * @param Integer       text_segment_index     the id of the associated text segment
     * @param Integer       toggle_color_count  the count to toggle the background color by
     */
    var _getTimeSegmentHtml= function($this, text_segment_index, toggle_color_count) {
        var data = $this.data('mediaAlignedText');
        var editor_data = $this.data('mediaAlignedTextEditor');
        var text_segment = data.text_segments[text_segment_index];
        
        if(text_segment.time_start == undefined || text_segment.time_start == null) {
            return '';
        }
        else {
            var width = Math.round((parseFloat(text_segment.time_end) - parseFloat(text_segment.time_start)) * editor_data.time_editor_width_per_milisecond);
            var left_offset = Math.round(parseFloat(text_segment.time_start) * editor_data.time_editor_width_per_milisecond);
    
            return '<div id="time_segment_'+text_segment_index +'" '
                + 'class="mat_time_segment ' + data.color_toggle_classes[toggle_color_count % 4] + '" '
                + 'style = "width: ' + width +'px; left: ' + left_offset + 'px; top: 20px;">'
                + $(data.text_viewer_css_selector + ' [data-mat_segment='+text_segment_index+']').html() + '</div>';
        }
    };
    
    /**
     * Iniitalize the form to update the Media File and Text to Align
     */
    var _initFileAndTextLoader = function($this) {
        var data = $this.data('mediaAlignedText');
        
        $('#mat_media_url').val(data.media_files[0].media.mp3);
        $('#mat_media_title').val(data.media_files[0].title);
        $('#mat_media_type').val(data.media_files[0].media_type);
        $('#mat_media_file_type').val(data.media_files[0].media_file_type);
        $('#mat_text').val($(data.text_viewer_css_selector).html());
        
    };
    
    /**
     * Refresh the time editor starting with the first
     */
    var _initTimeEditor = function($this) {

        var editor_data = $this.data('mediaAlignedTextEditor');
        var data = $this.data('mediaAlignedText');
        var text_segments = $this.data('mediaAlignedText').text_segments;

        if(data.media_files[0] == undefined) return false;
        
      //@todo make total timespan based upon total media file times not just first one
        editor_data.time_editor_total_duration = data.media_files[0].duration * 1000;
        editor_data.time_editor_viewable_timespan = editor_data.viewable_media_segments * editor_data.time_editor_total_duration/text_segments.length;
        editor_data.time_editor_width_per_milisecond = $('#mat_time_editor').width() / editor_data.time_editor_viewable_timespan; 

        //set the width of the entire timespan
        $('#mat_timeline').width(Math.round(editor_data.time_editor_total_duration*editor_data.time_editor_width_per_milisecond));
        

        var count = 0;
        var html = '<div id="mat_time_slider"></div>';
        
        for(var i in text_segments) {
            
            $('[data-mat_segment=' + i +']').addClass(editor_data.color_toggle_classes[count % 4]);
            html = html + _getTimeSegmentHtml($this, i, count);
            count++;
        }
       
        $('#mat_timeline').html(html);
        
        //add the click function to the time segments
        $('#mat_timeline').on(
            'click.mediaAlignedTextEditor',
            '.mat_time_segment',
            {'parent' : $this},
            function(event) {
                event.data.parent.mediaAlignedTextEditor('timeSegmentClicked', $(this).attr('id'));
        });
        
        //add the time slider
        $('#mat_time_slider').slider({
            range: true,
            min: 0,
            max: 1,
            values: [0, 1],
            step: .01,
            slide: function(event, ui) {
                if(ui.values[0] < ui.values[1]) {
                    $('#mat_editor_start_time').val(ui.values[0]);
                    $('#mat_editor_end_time').val(ui.values[1]);
                    $this.mediaAlignedTextEditor('updateSegmentTime');
                }
            }
        });
        
        $('#mat_time_slider').hide();
        
        
    };
    /**
     * set up the time slider to reference the passed in text_segment_index
     */
    var _setTimeSlider = function($this, text_segment_index) {
        var editor_data = $this.data('mediaAlignedTextEditor');
        var data = $this.data('mediaAlignedText');
        
        var text_segment = data.text_segments[text_segment_index];
        
        if(text_segment == undefined) return false;
       
        //get starting time
        if(text_segment_index == 0) {
            var time_start = text_segment.time_start/1000;
        }
        else {
            //set start time to previous time segment + 50
            var time_start = data.text_segments[text_segment_index - 1].time_start/1000 + .05;
        }
        
        //get ending time
        if(text_segment_index == data.text_segments.length - 1) {
            var time_end = text_segment.time_end/1000;
        }
        else {
            //set start time to previous time segment - 50
            var time_end = data.text_segments[text_segment_index + 1].time_end/1000 - .05;
        }
        
        
        //update the time segments
        var width = Math.round((time_end - time_start) * editor_data.time_editor_width_per_milisecond * 1000);
        var left_offset = Math.round(time_start * editor_data.time_editor_width_per_milisecond * 1000);
        
        $('#mat_time_slider').css('width', width+'px');
        $('#mat_time_slider').css('left', left_offset+'px');
        $('#mat_time_slider').slider('option',{
                'min': time_start,
                'max': time_end,
                'values': [text_segment.time_start/1000, text_segment.time_end/1000]
        });

        $('#mat_time_slider').show();
    }
    /**
     * Highlight a particular time segment
     * 
     * @param jQueryObject     $this    The obect on which the mediaAlignedText has been instantiated
     * @param time_segment_id  integer  The id of the textSegment to be highlighted
     */
    var _textSegmentHighlight = function($this, text_segment_index) {
        
        //remove previous highlights
        $('.mat_highlighted_time_segment').removeClass('mat_highlighted_time_segment');
        $('.mat_highlighted_text_segment').removeClass('mat_highlighted_text_segment');
        
        //add the highlight classes 
        $('#time_segment_'+text_segment_index).addClass('mat_highlighted_time_segment');
        $('[data-mat_segment='+text_segment_index+']').addClass('mat_highlighted_text_segment');
        
        //scroll to the appropriate spot of the text
        if($('.mat_highlighted_text_segment').length > 0) {
            $($this.data('mediaAlignedText').text_viewer_css_selector).scrollTo('.mat_highlighted_text_segment', 250, {'axis': 'y', 'offset': -20});
        }
        
        //scroll to the appropriate spot of the time line
        if($('.mat_highlighted_time_segment').length > 0) {
            $('#mat_time_editor').scrollTo('.mat_highlighted_time_segment', 100, {'axis': 'x', 'offset': -200});
        }
        
        //populate the fields for manual entry
        var text_segment = $this.data('mediaAlignedText').text_segments[text_segment_index];
        
        ///could be recording
        if(text_segment != undefined) {
            $('#mat_editor_start_time').val(text_segment.time_start/1000);
            $('#mat_editor_end_time').val(text_segment.time_end/1000);
        }
    
        _setTimeSlider($this, parseFloat(text_segment_index));
        
    };
    
    /**
     * Remove the highlight on a particular text segment
     * 
     * @param jQueryObject     $this   The obect on which the mediaAlignedText has been instantiated
     * @param text_segment_index  integer  The id of the textSegment to have highlighting removed
     */
    var _textSegmentRemoveHighlight = function($this, text_segment_index){

        $('[data-mat_segment='+text_segment_index+']').removeClass('mat_highlighted_text_segment');
        /*
        $('#time_segment_'+text_segment_index).removeClass('mat_highlighted_time_segment');
        $('.mat_text_segment_'+text_segment_index).removeClass('mat_highlighted_text_segment');
        $('#mat_editor_start_time').val('');
        $('#mat_editor_end_time').val('');
        */
    };
    
    /**
     * time_start integer   time in miliseconds that the text segment should start
     * time_end   integer   time in miliseconds that the text segment should stop
     */
    var _updateSegmentTime = function($this, text_segment_index, time_start, time_end) {
        var editor_data = $this.data('mediaAlignedTextEditor');
        var data = $this.data('mediaAlignedText');
        
        //update the time segments 
        //@todo data validation
        data.text_segments[text_segment_index].time_start = parseFloat(time_start);
        data.text_segments[text_segment_index].time_end = parseFloat(time_end);
        
        //update the html
        $('[data-mat_segment="' + text_segment_index + '"]').attr(data.time_start_attribute, time_start);
        $('[data-mat_segment="' + text_segment_index + '"]').attr(data.time_end_attribute, time_end);
        
        //update the time segments
        var width = Math.round((time_end - time_start) * editor_data.time_editor_width_per_milisecond);
        var left_offset = Math.round(time_start * editor_data.time_editor_width_per_milisecond);
        
        $('#time_segment_'+text_segment_index).css('width', width+'px');
        $('#time_segment_'+text_segment_index).css('left', left_offset+'px');
        
        $this.data('mediaAlignedText', data);
        
    };
})( jQuery );