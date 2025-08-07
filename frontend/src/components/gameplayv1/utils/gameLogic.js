/**
 * Game Logic Utilities
 * 
 * Handles scoring, match data management, and game result processing
 * for the Rock Paper Scissors game system.
 */

/**
 * Update game scores based on round result
 * @param {string} winner - Winner of the round ("player", "computer", "draw")
 * @param {Object} scoreRefs - References to score tracking
 * @param {Object} scoreSetters - State setters for scores
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} updateScore - Redux action to update scores
 */
export const updateGameScore = (winner, scoreRefs, scoreSetters, dispatch, updateScore) => {
	console.log(`🏆 Updating score - Winner: ${winner}`);

	const { playerScoreRef, computerScoreRef, drawScoreRef } = scoreRefs;
	const { setPlayerScore, setComputerScore, setDrawScore } = scoreSetters;

	if (winner === "player") {
		setPlayerScore((prev) => {
			const newScore = prev + 1;
			playerScoreRef.current = newScore; // Keep ref in sync
			return newScore;
		});
		dispatch(updateScore({ player: 1, computer: 0 }));
	} else if (winner === "computer") {
		setComputerScore((prev) => {
			const newScore = prev + 1;
			computerScoreRef.current = newScore; // Keep ref in sync
			return newScore;
		});
		dispatch(updateScore({ player: 0, computer: 1 }));
	} else if (winner === "draw") {
		setDrawScore((prev) => {
			const newScore = prev + 1;
			drawScoreRef.current = newScore; // Keep ref in sync
			return newScore;
		});
		// Draw doesn't update Redux game score, just local tracking
	}

	console.log(
		`📊 Current totals - Player: ${playerScoreRef.current}, Computer: ${computerScoreRef.current}, Draws: ${drawScoreRef.current}`
	);
};

/**
 * Save completed match data to Redux store
 * @param {Object} matchContext - Game context for match data
 * @param {Object} scoreRefs - References to final scores
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} addMatch - Redux action to add match
 */
export const saveMatchData = (matchContext, scoreRefs, dispatch, addMatch) => {
	const { gameMode, rounds, currentPlayer } = matchContext;
	const { playerScoreRef, computerScoreRef, drawScoreRef } = scoreRefs;

	// Use current ref values to ensure we have the latest scores
	const finalPlayerWins = playerScoreRef.current;
	const finalComputerWins = computerScoreRef.current;
	const finalDraws = drawScoreRef.current;

	const matchData = {
		playerName: currentPlayer?.name || "Guest", // Player identifier
		model: "MobileNetV2", // AI model used for predictions
		rounds: gameMode === "classic" ? 1 : rounds, // Total rounds played
		datetime: new Date().toISOString(), // Match completion timestamp
		playerWins: finalPlayerWins, // Player's win count
		computerWins: finalComputerWins, // Computer's win count
		draws: finalDraws, // Number of draw rounds
		streak: finalPlayerWins > finalComputerWins ? finalPlayerWins : 0, // Win streak calculation
		gameMode, // Game mode (classic/tournament)
	};

	console.log("💾 Saving match data to Redux store:", matchData);
	console.log(
		`📊 Final Score - Player: ${finalPlayerWins}, Computer: ${finalComputerWins}, Draws: ${finalDraws}`
	);
	console.log(
		`🏆 Winner: ${
			finalPlayerWins > finalComputerWins
				? "Player"
				: finalComputerWins > finalPlayerWins
				? "Computer"
				: "Draw"
		}`
	);

	// Add match to player's game history in Redux store
	dispatch(addMatch(matchData));
	console.log("✅ Match data saved successfully!");
};

/**
 * Convert choice string to corresponding emoji
 * @param {string} choice - The choice string ("rock", "paper", "scissors")
 * @returns {string} - Corresponding emoji
 */
export const getEmojiForChoice = (choice) => {
	const choices = {
		rock: "🗿",
		paper: "📄",
		scissors: "✂️",
	};
	return choices[choice] || "🤖";
};

/**
 * Handle API connection errors and continue game flow
 * @param {Object} errorHandlers - Functions to handle error state
 * @param {Object} refs - References for result tracking
 */
export const handleAPIError = (errorHandlers, refs) => {
	console.log("⚠️ Handling API error - providing fallback result");

	const { setFinalResult, setComputerChoice, updateGameScore, setGameState, handleRoundCompletion } = errorHandlers;
	const { resultReceivedRef } = refs;

	if (!resultReceivedRef.current) {
		resultReceivedRef.current = true;

		// Create error result that awards point to computer
		const errorResult = {
			status: "error",
			final_prediction: "error",
			confidence: 0.0,
			detected_hand: false,
			game_result: {
				player_move: "error",
				winner: "computer",
				valid_move: false,
				reason: "Connection error",
			},
		};

		// Update UI and continue game flow
		setFinalResult(errorResult);
		setComputerChoice("🗿");
		updateGameScore("computer");

		setGameState("result");
		setTimeout(() => {
			handleRoundCompletion();
		}, 3000);
	}
};

/**
 * Reset all score tracking (both state and refs)
 * @param {Object} scoreSetters - State setters for scores
 * @param {Object} scoreRefs - References to score tracking
 */
export const resetScores = (scoreSetters, scoreRefs) => {
	const { setPlayerScore, setComputerScore, setDrawScore } = scoreSetters;
	const { playerScoreRef, computerScoreRef, drawScoreRef } = scoreRefs;

	setPlayerScore(0);
	setComputerScore(0);
	setDrawScore(0);
	playerScoreRef.current = 0;
	computerScoreRef.current = 0;
	drawScoreRef.current = 0;
	console.log("🔄 All scores reset to 0");
};
