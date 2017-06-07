// vers 1.0.0

const format = require('./format.js');

const BossId = [981, 3000]; // Lakan HM

//MessageId: BossAction
const BossMessages = {
	9981043: 1205142908,   // Lakan has noticed you.
	9981044: 1205144607,   // Lakan is trying to take you on one at a time.
	9981045: 1205142805    // Lakan intends to kill all of you at once.
};

const BossActions = {
	1205142648: {msg: 'Get out'},            // Begone purple
	1205142649: {msg: 'Get in'},             // Begone orange
	1205142905: {msg: 'plague/regress'},     // Shield normal to inverse
	1205142906: {msg: 'sleep'},              // Shield inverse to normal
	// Normal
	1205142908: {msg: 'Debuff (closest)',    next: 1205144607,    prev: 1205142805},   // Debuff aka Mark
	1205144607: {msg: 'Spread',              next: 1205142805,    prev: 1205142908},   // Spread aka Circles
	1205142805: {msg: 'Gather + cleanse',    next: 1205142908,    prev: 1205144607},   // Gather aka Bombs
	// Inversed
	1205142909: {msg: 'Debuff (furthest)',   next: 1205144609,    prev: 1205142806},   // Debuff aka Mark
	1205144609: {msg: 'Gather',              next: 1205142806,    prev: 1205142909},   // Spread aka Circles
	1205142806: {msg: 'Gather + no cleanse', next: 1205142909,    prev: 1205144609},   // Gather aka Bombs
};

const InversedAction = {
	1205142908: 1205142909,
	1205144607: 1205144609,
	1205142805: 1205142806,
	1205142909: 1205142908,
	1205144609: 1205144607,
	1205142806: 1205142805
};

const ShieldWarningTime = 80000; //ms
const ShieldWarningMessage = 'Ring soon, get ready to dodge';

module.exports = function VSHMLakanGuide(dispatch) {
	
	let enabled = true,
		sendToParty = false,
		showNextMechanicMessage = true,
		showShieldWarnings = true,
		showBegoneMessages = true,
		boss = undefined,
		shieldWarned = false,
		timerNextMechanic = undefined, 
		lastNextAction = undefined,
		lastInversionTime = undefined,
		isReversed = false,
		isInversed = false;
		
	const chatHook = event => {		
		let command = format.stripTags(event.message).split(' ');
		
		if (['!vshm-lakan', '!vshmlakan'].includes(command[0].toLowerCase())) {
			toggleModule();
			return false;
		} else if (['!vshm-lakan.party', '!vshmlakan.party'].includes(command[0].toLowerCase())) {
			toggleSentMessages();
			return false;
		}
	}
	dispatch.hook('C_CHAT', 1, chatHook)	
	dispatch.hook('C_WHISPER', 1, chatHook)
  	
	// slash support
	try {
		const Slash = require('slash')
		const slash = new Slash(dispatch)
		slash.on('vshm-lakan', args => toggleModule())
		slash.on('vshmlakan', args => toggleModule())
		slash.on('vshm-lakan.party', args => toggleSentMessages())
		slash.on('vshmlakan.party', args => toggleSentMessages())
	} catch (e) {
		// do nothing because slash is optional
	}
			
	function toggleModule() {
		enabled = !enabled;
		systemMessage((enabled ? 'enabled' : 'disabled'));
	}

	function toggleSentMessages() {
		sendToParty = !sendToParty;
		systemMessage((sendToParty ? 'Messages will be sent to the party' : 'Only you will see messages'));
	}	
	
	dispatch.hook('S_DUNGEON_EVENT_MESSAGE', 1, (event) => {	
		if (!enabled || !boss) return;
		
		let msgId = parseInt(event.message.replace('@dungeon:', ''));
		if (BossMessages[msgId]) {
			if (timerNextMechanic) clearTimeout(timerNextMechanic);
			sendMessage('Next: ' + BossActions[BossMessages[msgId]].msg);
			(bossHealth() > 0.5) ? isReversed = false : isReversed = true;
		}
	})
	
	function bossHealth() {
		return (boss.curHp / boss.maxHp);
	}
	
	dispatch.hook('S_BOSS_GAGE_INFO', 2, (event) => {
		if (!enabled) return;
		
		if (event.huntingZoneId == BossId[0] && event.templateId == BossId[1]) {
			boss = event;
		}
		
		if (boss) {
			let bossHp = bossHealth();
			
			if (bossHp <= 0) {
				boss = undefined;
				lastNextAction = undefined;
				isReversed = false;
				isInversed = false;
				shieldWarned = false;
				lastInversionTime = undefined;
				clearTimeout(timerNextMechanic);
			} else if (bossHp == 1) {
				lastInversionTime = undefined;
				shieldWarned = false;
			} else {
				if (!lastInversionTime) lastInversionTime = Date.now();
			}
			
			if (Date.now() > (lastInversionTime + ShieldWarningTime) && !shieldWarned && boss) {
				if (showShieldWarnings) sendMessage(ShieldWarningMessage);
				shieldWarned = true;
			}
		}
	 })
			
	dispatch.hook('S_ACTION_STAGE', 1, (event) => {
		if (!enabled || !boss) return;
		
		if (boss.id - event.source == 0) {
			 if (BossActions[event.skill]) {
				if (!showBegoneMessages && (event.skill == 1205142648 || event.skill == 1205142649)) return;
				sendMessage(BossActions[event.skill].msg);
				
				if (!showNextMechanicMessage) return;
				
				let nextMessage;
				if (event.skill == 1205142905) {                                                 // normal to inverse
					isInversed = true;
					nextMessage = BossActions[InversedAction[lastNextAction]].msg;
					startTimer('Next: ' + nextMessage);
					lastInversionTime = Date.now();
					shieldWarned = false;
				} else if (event.skill == 1205142906) {                                          // inverse to normal
					isInversed = false;
					nextMessage = BossActions[InversedAction[lastNextAction]].msg;
					startTimer('Next: ' + nextMessage);
					lastInversionTime = Date.now();
					shieldWarned = false;
				} else if (!isReversed && BossActions[event.skill].next) {                       // normal "next"
					nextMessage = BossActions[BossActions[event.skill].next].msg;
					lastNextAction = BossActions[event.skill].next;
					startTimer('Next: ' + nextMessage);
				} else if (isReversed && BossActions[event.skill].prev) {                        // reversed "next"
					nextMessage = BossActions[BossActions[event.skill].prev].msg;
					startTimer('Next: ' + nextMessage);
					lastNextAction = BossActions[event.skill].prev;
				}
				
			}
		}
	})
	
	function startTimer(message) {
		if (timerNextMechanic) clearTimeout(timerNextMechanic);
		timerNextMechanic = setTimeout(() => {
			sendMessage(message);
			timerNextMechanic = null;
		}, 5000);	
	}

	function sendMessage(msg) {
		if (!enabled) return;
		
		if (sendToParty) {
			dispatch.toServer('C_CHAT', 1, {
				channel: 21, //21 = p-notice, 1 = party
				message: msg
			});
		} else {
			dispatch.toClient('S_CHAT', 1, {
				channel: 21, //21 = p-notice, 1 = party
				authorName: 'DG-Guide',
				message: msg
			});
		}		
	}	
		
	function systemMessage(msg) {
		dispatch.toClient('S_CHAT', 1, {
			channel: 24, //system channel
			authorName: '',
			message: ' (VSHM-Lakan-Guide) ' + msg
		});
	}

}