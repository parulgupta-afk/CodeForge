"""Simple calculator with a deliberate off-by-one bug in divide."""

def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        raise ValueError("division by zero")
    # BUG: off-by-one — should be a / b
    return (a / b) + 1
