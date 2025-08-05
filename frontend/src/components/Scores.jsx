"use client";
import React from "react";
import { useSelector } from "react-redux";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { selectAllMatches } from "../redux/slices/gameDataSlice";
import RPSense from "./CustomUI/RPSense";

/**
 * Scores Component
 * 
 * Displays match history and player statistics in a table format.
 * Shows player performance, scores, game modes, and timestamps.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.navigateTo - Navigation function to return to menu
 */
const Scores = ({ navigateTo }) => {
  // Get all matches from Redux store
  const matches = useSelector(selectAllMatches);

  /**
   * Format datetime string into separate date and time components
   * @param {string} datetime - ISO datetime string
   * @returns {Object} Object with formatted date and time strings
   */
  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  /**
   * Generate score display string and determine win status
   * @param {Object} match - Match object with win/loss/draw counts
   * @returns {Object} Object with score string and win status
   */
  const getScoreDisplay = (match) => {
    const playerWon = match.playerWins > match.computerWins;
    const hasDraws = match.draws > 0;
    
    return {
      score: hasDraws 
        ? `${match.playerWins}/${match.computerWins}/${match.draws}`
        : `${match.playerWins}/${match.computerWins}`,
      isWin: playerWon,
    };
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 overflow-hidden">
      {/* Header with RPSense and Go Back Button */}
      <div className="flex items-center justify-between px-8 py-6">
        {/* Go Back Button */}
        <div
          onClick={() => navigateTo("menu")}
          className="
            text-lg font-semibold py-2 px-4 cursor-pointer
            text-purple-400 hover:text-purple-300 
            hover:scale-105 transition-all duration-300
            relative
          "
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigateTo("menu");
            }
          }}
        >
          Go Back
          {/* Animated underline */}
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 hover:scale-x-100 transition-transform duration-300" />
        </div>

        {/* RPSense Logo */}
        <RPSense />

        {/* Spacer for balance */}
        <div className="w-36"></div>
      </div>

      {/* Table Container with Custom Scrollbar */}
      <div className="px-8 pb-8 h-[calc(100vh-140px)]">
        <div className="rounded-lg border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm h-full">
          <div
            className="h-full overflow-auto custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#06b6d4 #1e293b",
            }}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
                <TableRow className="border-cyan-500/30 hover:bg-slate-800/50">
                  <TableHead className="text-cyan-400 font-semibold">
                    Player
                  </TableHead>
                  <TableHead className="text-cyan-400 font-semibold">
                    Model
                  </TableHead>
                  <TableHead className="text-cyan-400 font-semibold">
                    Mode
                  </TableHead>
                  <TableHead className="text-cyan-400 font-semibold">
                    Rounds
                  </TableHead>
                  <TableHead className="text-cyan-400 font-semibold">
                    Date
                  </TableHead>
                  <TableHead className="text-cyan-400 font-semibold">
                    Time
                  </TableHead>
                  <TableHead className="text-cyan-400 font-semibold">
                    Score
                  </TableHead>
                  <TableHead className="text-cyan-400 font-semibold">
                    Streak
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={8}
                      className="text-center text-slate-400 py-8"
                    >
                      No matches played yet
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((match) => {
                    const { date, time } = formatDateTime(match.datetime);
                    const { score, isWin } = getScoreDisplay(match);

                    return (
                      <TableRow
                        key={match.id}
                        className="border-slate-600/30 hover:bg-slate-800/30 transition-colors"
                      >
                        <TableCell className="text-white font-medium">
                          {match.playerName}
                        </TableCell>
                        <TableCell className="text-purple-400">
                          {match.model}
                        </TableCell>
                        <TableCell className="text-cyan-300 capitalize">
                          {match.gameMode || "classic"}
                        </TableCell>
                        <TableCell className="text-blue-400">
                          {match.rounds}
                        </TableCell>
                        <TableCell className="text-slate-300">{date}</TableCell>
                        <TableCell className="text-slate-300">{time}</TableCell>
                        <TableCell
                          className={`font-bold ${
                            isWin ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {score}
                        </TableCell>
                        <TableCell className="text-yellow-400">
                          {match.streak}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Neon glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Scores;
