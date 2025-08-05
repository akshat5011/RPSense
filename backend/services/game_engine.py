import random

class GameEngine:
    """
    Simple Rock Paper Scissors game engine
    Generates computer moves and determines winners
    """
    
    def __init__(self):
        self.moves = ['rock', 'paper', 'scissors']
        self.rules = {
            'rock': 'scissors',      # rock beats scissors
            'scissors': 'paper',     # scissors beats paper
            'paper': 'rock'          # paper beats rock
        }
    
    def generate_computer_move(self):
        """
        Generate a random computer move
        Returns: string (rock, paper, or scissors)
        """
        return random.choice(self.moves)
    
    def determine_winner(self, player_move, computer_move):
        """
        Determine the winner based on standard RPS rules
        Args:
            player_move (str): Player's move
            computer_move (str): Computer's move
        Returns:
            str: 'player', 'computer', or 'draw'
        """
        # If player move is invalid, computer wins by default
        if player_move not in self.moves:
            return 'computer'
            
        if player_move == computer_move:
            return 'draw'
        elif self.rules[player_move] == computer_move:
            return 'player'
        else:
            return 'computer'
    
    def play_round(self, player_move):
        """
        Play a complete round of RPS
        Args:
            player_move (str): Player's move (rock, paper, scissors, or invalid)
        Returns:
            dict: {
                'computer_move': str,
                'winner': str,
                'player_move': str,
                'valid_move': bool
            }
        """
        computer_move = self.generate_computer_move()
        winner = self.determine_winner(player_move, computer_move)
        
        # Check if player move was valid
        valid_move = player_move in self.moves
        
        return {
            'computer_move': computer_move,
            'player_move': player_move,
            'winner': winner,
            'valid_move': valid_move,
            'reason': 'Invalid move - Computer wins!' if not valid_move else None
        }