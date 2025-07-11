"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSelector, useDispatch } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  selectAllPlayers,
  selectCurrentPlayer,
  createPlayer,
  deletePlayer,
  updatePlayer,
  setCurrentPlayer,
} from "../../redux/slices/gameDataSlice";

const PlayerModal = ({ children }) => {
  const dispatch = useDispatch();
  const players = useSelector(selectAllPlayers);
  const currentPlayer = useSelector(selectCurrentPlayer);

  const [isOpen, setIsOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editName, setEditName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Create default "Guest" player if no players exist
  useEffect(() => {
    if (players.length === 0) {
      dispatch(createPlayer({ name: "Guest" }));
    }
  }, [players.length, dispatch]);

  // Set Guest as current player if no current player is selected
  useEffect(() => {
    if (!currentPlayer && players.length > 0) {
      const guestPlayer = players.find((player) => player.name === "Guest");
      if (guestPlayer) {
        dispatch(setCurrentPlayer(guestPlayer.id));
      } else {
        // If no Guest player, set the first player as current
        dispatch(setCurrentPlayer(players[0].id));
      }
    }
  }, [currentPlayer, players, dispatch]);

  const handleCreatePlayer = () => {
    if (newPlayerName.trim()) {
      dispatch(createPlayer({ name: newPlayerName.trim() }));
      setNewPlayerName("");
      setIsCreating(false);
    }
  };

  const handleSelectPlayer = (player) => {
    dispatch(setCurrentPlayer(player.id));
    setIsOpen(false);
  };

  const handleDeletePlayer = (playerId) => {
    // Prevent deleting the last player
    if (players.length === 1) {
      alert("Cannot delete the default player.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this player?")) {
      dispatch(deletePlayer(playerId));
    }
  };

  const handleStartEdit = (player) => {
    setEditingPlayer(player.id);
    setEditName(player.name);
  };

  const handleSaveEdit = () => {
    if (editName.trim()) {
      dispatch(
        updatePlayer({
          playerId: editingPlayer,
          updates: { name: editName.trim() },
        })
      );
      setEditingPlayer(null);
      setEditName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
    setEditName("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-900/95 border-cyan-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400">
            Player Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Player */}
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <Label className="text-cyan-300 text-sm">Current Player:</Label>
            <div className="text-lg font-semibold text-white">
              {currentPlayer?.name || "Loading..."}
            </div>
          </div>

          {/* Players List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold text-white">
                All Players ({players.length})
              </Label>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                size="sm"
              >
                + Add Player
              </Button>
            </div>

            {/* Add New Player Form */}
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"
              >
                <div className="space-y-2">
                  <Label className="text-purple-300">New Player Name:</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Enter player name..."
                      className="bg-slate-800 border-purple-500/30 text-white"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleCreatePlayer()
                      }
                    />
                    <Button
                      onClick={handleCreatePlayer}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      Create
                    </Button>
                    <Button
                      onClick={() => {
                        setIsCreating(false);
                        setNewPlayerName("");
                      }}
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Players List */}
            <div className="max-h-40 overflow-y-auto space-y-2">
              <AnimatePresence>
                {players.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      currentPlayer?.id === player.id
                        ? "bg-cyan-500/20 border-cyan-500/50"
                        : "bg-slate-800/50 border-slate-600/30 hover:bg-slate-700/50"
                    }`}
                  >
                    {editingPlayer === player.id ? (
                      // Edit Mode
                      <div className="flex gap-2 items-center">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-slate-800 border-cyan-500/30 text-white flex-1"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSaveEdit()
                          }
                        />
                        <Button
                          onClick={handleSaveEdit}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex items-center justify-between">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleSelectPlayer(player)}
                        >
                          <div className="font-medium text-white hover:text-cyan-300 transition-colors">
                            {player.name}
                            {currentPlayer?.id === player.id && (
                              <span className="ml-2 text-xs text-cyan-400">
                                (Current)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleStartEdit(player)}
                            size="sm"
                            variant="ghost"
                            className="text-yellow-400 hover:bg-yellow-500/10 h-8 w-8 p-0"
                          >
                            ✏️
                          </Button>
                          <Button
                            onClick={() => handleDeletePlayer(player.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                            disabled={players.length === 1}
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerModal;
