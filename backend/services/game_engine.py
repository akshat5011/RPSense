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
            str: 'player', 'computer', or 'tie'
        """
        if player_move == computer_move:
            return 'tie'
        elif self.rules[player_move] == computer_move:
            return 'player'
        else:
            return 'computer'
    
    def play_round(self, player_move):
        """
        Play a complete round of RPS
        Args:
            player_move (str): Player's move (rock, paper, scissors)
        Returns:
            dict: {
                'computer_move': str,
                'winner': str
            }
        """
        computer_move = self.generate_computer_move()
        winner = self.determine_winner(player_move, computer_move)
        
        return {
            'computer_move': computer_move,
            'winner': winner
        }