import tkinter as tk
from tkinter import messagebox
import random

class BingoGame:
    def __init__(self, root):
        self.root = root
        self.root.title("Bingo")
        self.root.geometry("400x550")
        
        self.grid_entries = []
        self.grid_labels = []
        self.numbers_grid = []
        self.marked = [[False for _ in range(5)] for _ in range(5)]
        
        self.setup_ui()
        
    def setup_ui(self):
        self.setup_frame = tk.Frame(self.root)
        self.setup_frame.pack(pady=20, padx=10)
        
        tk.Label(self.setup_frame, text="Enter numbers 1-25 in the grid:", font=('Arial', 12, 'bold')).grid(row=0, column=0, columnspan=5, pady=(0, 15))
        
        # Create 5x5 grid of entries for input
        for r in range(5):
            row_entries = []
            for c in range(5):
                entry = tk.Entry(self.setup_frame, width=4, font=('Arial', 16), justify='center')
                entry.grid(row=r+1, column=c, padx=3, pady=3)
                row_entries.append(entry)
            self.grid_entries.append(row_entries)
            
        btn_frame = tk.Frame(self.setup_frame)
        btn_frame.grid(row=6, column=0, columnspan=5, pady=20)
        
        tk.Button(btn_frame, text="Auto-fill (Random)", font=('Arial', 10), command=self.auto_fill).pack(side=tk.LEFT, padx=10)
        tk.Button(btn_frame, text="Start Game", font=('Arial', 10, 'bold'), bg='lightblue', command=self.start_game).pack(side=tk.LEFT, padx=10)
        
        self.game_frame = tk.Frame(self.root)
        self.status_label = tk.Label(self.root, text="", font=('Arial', 32, 'bold'), fg='blue')

    def auto_fill(self):
        """Helper to fill the grid automatically for faster testing/playing."""
        numbers = list(range(1, 26))
        random.shuffle(numbers)
        idx = 0
        for r in range(5):
            for c in range(5):
                self.grid_entries[r][c].delete(0, tk.END)
                self.grid_entries[r][c].insert(0, str(numbers[idx]))
                idx += 1

    def start_game(self):
        """Validate input and start the bingo game."""
        try:
            numbers = []
            for r in range(5):
                for c in range(5):
                    val = self.grid_entries[r][c].get().strip()
                    if not val:
                        raise ValueError("Please fill all cells.")
                    if not val.isdigit():
                        raise ValueError("Only numbers are allowed.")
                    num = int(val)
                    if num < 1 or num > 25:
                        raise ValueError("Numbers must be between 1 and 25.")
                    if num in numbers:
                        raise ValueError(f"Duplicate number found: {num}")
                    numbers.append(num)
                    
            # Save the valid numbers to our game grid
            self.numbers_grid = [numbers[i:i+5] for i in range(0, 25, 5)]
            
            # Hide setup UI and show game UI
            self.setup_frame.pack_forget()
            self.game_frame.pack(pady=20, padx=10)
            
            for r in range(5):
                row_lbls = []
                for c in range(5):
                    lbl = tk.Label(self.game_frame, text=str(self.numbers_grid[r][c]), 
                                   width=4, height=2, font=('Arial', 16), relief='raised', bg='white')
                    lbl.grid(row=r, column=c, padx=3, pady=3)
                    row_lbls.append(lbl)
                self.grid_labels.append(row_lbls)
                
            input_frame = tk.Frame(self.root)
            input_frame.pack(pady=10)
            tk.Label(input_frame, text="Enter called number: ", font=('Arial', 12)).pack(side=tk.LEFT)
            
            self.call_entry = tk.Entry(input_frame, width=6, font=('Arial', 16), justify='center')
            self.call_entry.pack(side=tk.LEFT, padx=5)
            self.call_entry.bind('<Return>', lambda e: self.mark_number())
            self.call_entry.focus()
            
            tk.Button(input_frame, text="Mark", font=('Arial', 12), command=self.mark_number).pack(side=tk.LEFT, padx=5)
            
            self.status_label.pack(pady=20)
            
        except ValueError as e:
            messagebox.showerror("Invalid Input", str(e))
            
    def mark_number(self):
        """Find the entered number in the grid and mark it."""
        try:
            val = self.call_entry.get().strip()
            if not val: return
            num = int(val)
            self.call_entry.delete(0, tk.END)
            
            found = False
            for r in range(5):
                for c in range(5):
                    if self.numbers_grid[r][c] == num:
                        if not self.marked[r][c]:
                            self.marked[r][c] = True
                            # Change cell appearance to indicate it's marked
                            self.grid_labels[r][c].config(bg='lightgreen', fg='black', relief='sunken')
                        found = True
                        break
                if found: break
                
            if not found:
                # Optional: you could show a brief "not found" message here if you want
                pass
                
            self.check_bingo()
            
        except ValueError:
            pass # Ignore invalid inputs in the marking entry
            
    def check_bingo(self):
        """Check how many lines are completed and update the BINGO label."""
        lines = 0
        
        # Check Rows
        for r in range(5):
            if all(self.marked[r]): 
                lines += 1
                
        # Check Columns
        for c in range(5):
            if all(self.marked[r][c] for r in range(5)): 
                lines += 1
                
        # Check Diagonals
        if all(self.marked[i][i] for i in range(5)): 
            lines += 1
        if all(self.marked[i][4-i] for i in range(5)): 
            lines += 1
        
        # Update the BINGO word display
        word = "BINGO"
        if lines > 0:
            show = " ".join(word[:min(lines, 5)])
            self.status_label.config(text=show)
            
        if lines >= 5:
            self.status_label.config(fg='green')
            messagebox.showinfo("BINGO!", "Congratulations, you got BINGO!")

if __name__ == "__main__":
    root = tk.Tk()
    app = BingoGame(root)
    root.mainloop()
