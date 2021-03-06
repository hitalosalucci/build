define(["Tone/core/Tone", "Tone/effect/Effect", "Tone/signal/Signal", "Tone/signal/Multiply"], function(Tone){

	"use strict";
	
	/**
	 * 	@class  Feedback Effect (a sound loop between an audio source and its own output)
	 *
	 *  @constructor
	 *  @extends {Tone.Effect}
	 *  @param {number|Object} [initialFeedback=0.125] the initial feedback value
	 */
	Tone.FeedbackEffect = function(){

		var options = this.optionsObject(arguments, ["feedback"]);
		options = this.defaultArg(options, Tone.FeedbackEffect.defaults);

		Tone.Effect.call(this, options);

		/**
		 *  controls the amount of feedback
		 *  @type {Tone.Signal}
		 */
		this.feedback = new Tone.Signal(options.feedback);
		
		/**
		 *  the gain which controls the feedback
		 *  @type {GainNode}
		 *  @private
		 */
		this._feedbackGain = this.context.createGain();

		//the feedback loop
		this.effectReturn.chain(this._feedbackGain, this.effectSend);
		this.feedback.connect(this._feedbackGain.gain);
	};

	Tone.extend(Tone.FeedbackEffect, Tone.Effect);

	/**
	 *  @static
	 *  @type {Object}
	 */
	Tone.FeedbackEffect.defaults = {
		"feedback" : 0.125
	};

	/**
	 *  set the feedback amount
	 *
	 *  @param {number} value  the amount of feedback
	 *  @param {Tone.Time=} rampTime (optionally) set the ramp time it takes 
	 *                               to reach the new feedback value
	 */
	Tone.FeedbackEffect.prototype.setFeedback = function(value, rampTime){
		if (rampTime){
			this.feedback.linearRampToValueNow(value, rampTime);
		} else {
			this.feedback.setValue(value);
		}
	};

	/**
	 *  set the parameters in bulk
	 *  @param {Object} params
	 */
	Tone.FeedbackEffect.prototype.set = function(params){
		if (!this.isUndef(params.feedback)) this.setFeedback(params.feedback);
		Tone.Effect.prototype.set.call(this, params);
	};

	/**
	 *  clean up
	 */
	Tone.FeedbackEffect.prototype.dispose = function(){
		Tone.Effect.prototype.dispose.call(this);
		this.feedback.dispose();
		this.feedback = null;
		this._feedbackGain.disconnect();
		this._feedbackGain = null;
	};

	return Tone.FeedbackEffect;
});
