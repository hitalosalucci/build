define(["Tone/core/Tone", "Tone/instrument/MonoSynth", "Tone/source/Source"], 
function(Tone){

	"use strict";

	/**
	 *  @class  Creates a polyphonic synthesizer out of 
	 *          the monophonic voice which is passed in. 
	 *
	 *  ```javascript
	 *  //a polysynth composed of 6 Voices of MonoSynth
	 *  var synth = new Tone.PolySynth(6, Tone.MonoSynth);
	 *  //set a MonoSynth preset
	 *  synth.setPreset("Pianoetta");
	 *  ```
	 *
	 *  @constructor
	 *  @extends {Tone.Instrument}
	 *  @param {number|Object} [polyphony=4] the number of voices to create
	 *  @param {function} [voice=Tone.MonoSynth] the constructor of the voices
	 *                                            uses Tone.MonoSynth by default
	 *  @param {Object} voiceOptions the options to pass to the voice                                          
	 */
	Tone.PolySynth = function(){

		Tone.Instrument.call(this);

		var options = this.optionsObject(arguments, ["polyphony", "voice", "voiceOptions"], Tone.PolySynth.defaults);

		/**
		 *  the array of voices
		 *  @private
		 *  @type {Array}
		 */
		this._voices = new Array(options.polyphony);

		/**
		 *  the queue of free voices
		 *  @private
		 *  @type {Array}
		 */
		this._freeVoices = [];

		/**
		 *  keeps track of which notes are down
		 *  @private
		 *  @type {Object}
		 */
		this._activeVoices = {};

		//create the voices
		for (var i = 0; i < options.polyphony; i++){
			var v = new options.voice(options.voiceOptions);
			this._voices[i] = v;
			v.connect(this.output);
		}

		//make a copy of the voices
		this._freeVoices = this._voices.slice(0);
	};

	Tone.extend(Tone.PolySynth, Tone.Instrument);

	/**
	 *  the defaults
	 *  @const
	 *  @static
	 *  @type {Object}
	 */
	Tone.PolySynth.defaults = {
		"polyphony" : 4,
		"voice" : Tone.MonoSynth,
		"voiceOptions" : {
			"portamento" : 0
		}
	};

	/**
	 *  trigger the attack
	 *  @param  {string|number|Object|Array} value the value of the note(s) to start.
	 *                                             if the value is an array, it will iterate
	 *                                             over the array to play each of the notes
	 *  @param  {Tone.Time} [time=now]  the start time of the note
	 *  @param {number} [velocity=1] the velocity of the note
	 */
	Tone.PolySynth.prototype.triggerAttack = function(value, time, velocity){
		if (!Array.isArray(value)){
			value = [value];
		}
		for (var i = 0; i < value.length; i++){
			var val = value[i];
			var stringified = JSON.stringify(val);
			if (this._activeVoices[stringified]){
				this._activeVoices[stringified].triggerAttack(val, time, velocity);
			} else if (this._freeVoices.length > 0){
				var voice = this._freeVoices.shift();
				voice.triggerAttack(val, time, velocity);
				this._activeVoices[stringified] = voice;
			}
		}
	};

	/**
	 *  trigger the attack and release after the specified duration
	 *  
	 *  @param  {string|number|Object|Array} value the note(s).
	 *                                             if the value is an array, it will iterate
	 *                                             over the array to play each of the notes
	 *  @param  {Tone.Time} duration the duration of the note
	 *  @param  {Tone.Time} [time=now]     if no time is given, defaults to now
	 *  @param  {number} [velocity=1] the velocity of the attack (0-1)
	 */
	Tone.PolySynth.prototype.triggerAttackRelease = function(value, duration, time, velocity){
		time = this.toSeconds(time);
		this.triggerAttack(value, time, velocity);
		this.triggerRelease(value, time + this.toSeconds(duration));
	};

	/**
	 *  trigger the release of a note
	 *  @param  {string|number|Object|Array} value the value of the note(s) to release.
	 *                                             if the value is an array, it will iterate
	 *                                             over the array to play each of the notes
	 *  @param  {Tone.Time} [time=now]  the release time of the note
	 */
	Tone.PolySynth.prototype.triggerRelease = function(value, time){
		if (!Array.isArray(value)){
			value = [value];
		}
		for (var i = 0; i < value.length; i++){
			//get the voice
			var stringified = JSON.stringify(value[i]);
			var voice = this._activeVoices[stringified];
			if (voice){
				voice.triggerRelease(time);
				this._freeVoices.push(voice);
				this._activeVoices[stringified] = null;
			}
		}
	};

	/**
	 *  set the options on all of the voices
	 *  @param {Object} params 
	 */
	Tone.PolySynth.prototype.set = function(params){
		for (var i = 0; i < this._voices.length; i++){
			this._voices[i].set(params);
		}
	};

	/**
	 *  @param {string} presetName the preset name
	 */
	Tone.PolySynth.prototype.setPreset = function(presetName){
		for (var i = 0; i < this._voices.length; i++){
			this._voices[i].setPreset(presetName);
		}
	};

	/**
	 *  clean up
	 */
	Tone.PolySynth.prototype.dispose = function(){
		Tone.Instrument.prototype.dispose.call(this);
		for (var i = 0; i < this._voices.length; i++){
			this._voices[i].dispose();
			this._voices[i] = null;
		}
		this._voices = null;
		this._activeVoices = null;
		this._freeVoices = null;
	};

	return Tone.PolySynth;
});