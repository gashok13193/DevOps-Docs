#!/usr/bin/env python3
"""
Day 8-9: Object-Oriented Programming
====================================

Learn the fundamentals of OOP in Python: classes, objects, and methods.
"""

print("=== BASIC CLASS DEFINITION ===")

class Person:
    """A simple class representing a person."""
    
    def __init__(self, name, age):
        """Initialize a new Person object."""
        self.name = name
        self.age = age
    
    def introduce(self):
        """Method to introduce the person."""
        return f"Hi, I'm {self.name} and I'm {self.age} years old."
    
    def have_birthday(self):
        """Method to increment age by 1."""
        self.age += 1
        return f"Happy birthday! {self.name} is now {self.age} years old."

# Creating objects (instances)
person1 = Person("Alice", 25)
person2 = Person("Bob", 30)

print(person1.introduce())
print(person2.introduce())

print(person1.have_birthday())
print(person1.introduce())

print("\n=== CLASS ATTRIBUTES VS INSTANCE ATTRIBUTES ===")

class Car:
    """A class representing a car."""
    
    # Class attribute (shared by all instances)
    wheels = 4
    
    def __init__(self, make, model, year, color):
        """Initialize a car instance."""
        # Instance attributes (unique to each instance)
        self.make = make
        self.model = model
        self.year = year
        self.color = color
        self.mileage = 0
    
    def drive(self, miles):
        """Drive the car and add to mileage."""
        self.mileage += miles
        return f"Drove {miles} miles. Total mileage: {self.mileage}"
    
    def get_info(self):
        """Get car information."""
        return f"{self.year} {self.color} {self.make} {self.model}"

car1 = Car("Toyota", "Camry", 2020, "Blue")
car2 = Car("Honda", "Civic", 2019, "Red")

print(f"Car 1: {car1.get_info()}")
print(f"Car 2: {car2.get_info()}")
print(f"Both cars have {Car.wheels} wheels")

print(car1.drive(100))
print(car2.drive(50))

print("\n=== METHODS AND SELF ===")

class BankAccount:
    """A class representing a bank account."""
    
    def __init__(self, account_holder, initial_balance=0):
        """Initialize a bank account."""
        self.account_holder = account_holder
        self.balance = initial_balance
        self.transaction_history = []
    
    def deposit(self, amount):
        """Deposit money into the account."""
        if amount > 0:
            self.balance += amount
            self.transaction_history.append(f"Deposited ${amount}")
            return f"Deposited ${amount}. New balance: ${self.balance}"
        return "Invalid deposit amount"
    
    def withdraw(self, amount):
        """Withdraw money from the account."""
        if amount > 0 and amount <= self.balance:
            self.balance -= amount
            self.transaction_history.append(f"Withdrew ${amount}")
            return f"Withdrew ${amount}. New balance: ${self.balance}"
        return "Invalid withdrawal amount or insufficient funds"
    
    def get_balance(self):
        """Get current balance."""
        return f"Current balance: ${self.balance}"
    
    def get_statement(self):
        """Get account statement."""
        statement = f"Account Statement for {self.account_holder}:\n"
        for transaction in self.transaction_history:
            statement += f"  - {transaction}\n"
        statement += f"Current Balance: ${self.balance}"
        return statement

# Using the BankAccount class
account = BankAccount("John Doe", 1000)
print(account.get_balance())
print(account.deposit(500))
print(account.withdraw(200))
print(account.withdraw(2000))  # Should fail
print("\n" + account.get_statement())

print("\n=== INHERITANCE ===")

class Animal:
    """Base class for all animals."""
    
    def __init__(self, name, species):
        """Initialize an animal."""
        self.name = name
        self.species = species
        self.is_alive = True
    
    def eat(self):
        """All animals can eat."""
        return f"{self.name} is eating."
    
    def sleep(self):
        """All animals can sleep."""
        return f"{self.name} is sleeping."
    
    def make_sound(self):
        """Base method for making sound."""
        return f"{self.name} makes a sound."

class Dog(Animal):
    """Dog class inheriting from Animal."""
    
    def __init__(self, name, breed):
        """Initialize a dog."""
        super().__init__(name, "Dog")  # Call parent constructor
        self.breed = breed
    
    def make_sound(self):
        """Override the make_sound method."""
        return f"{self.name} barks: Woof! Woof!"
    
    def fetch(self):
        """Dogs can fetch."""
        return f"{self.name} fetches the ball!"

class Cat(Animal):
    """Cat class inheriting from Animal."""
    
    def __init__(self, name, color):
        """Initialize a cat."""
        super().__init__(name, "Cat")
        self.color = color
    
    def make_sound(self):
        """Override the make_sound method."""
        return f"{self.name} meows: Meow!"
    
    def climb(self):
        """Cats can climb."""
        return f"{self.name} climbs up the tree!"

# Using inheritance
dog = Dog("Buddy", "Golden Retriever")
cat = Cat("Whiskers", "Orange")

print(f"Dog: {dog.name}, Species: {dog.species}, Breed: {dog.breed}")
print(dog.eat())
print(dog.make_sound())
print(dog.fetch())

print(f"\nCat: {cat.name}, Species: {cat.species}, Color: {cat.color}")
print(cat.eat())
print(cat.make_sound())
print(cat.climb())

print("\n=== POLYMORPHISM ===")

def animal_sounds(animals):
    """Demonstrate polymorphism with different animals."""
    for animal in animals:
        print(animal.make_sound())

animals = [dog, cat]
animal_sounds(animals)

print("\n=== ENCAPSULATION (PRIVATE ATTRIBUTES) ===")

class Student:
    """A class demonstrating encapsulation."""
    
    def __init__(self, name, student_id):
        """Initialize a student."""
        self.name = name
        self.__student_id = student_id  # Private attribute
        self.__grades = []  # Private list
    
    def add_grade(self, subject, grade):
        """Add a grade for a subject."""
        if 0 <= grade <= 100:
            self.__grades.append({"subject": subject, "grade": grade})
            return f"Added grade {grade} for {subject}"
        return "Invalid grade (must be 0-100)"
    
    def get_gpa(self):
        """Calculate and return GPA."""
        if not self.__grades:
            return 0.0
        total = sum(grade_info["grade"] for grade_info in self.__grades)
        return round(total / len(self.__grades), 2)
    
    def get_student_info(self):
        """Get student information."""
        return {
            "name": self.name,
            "student_id": self.__student_id,
            "gpa": self.get_gpa(),
            "grades": self.__grades.copy()  # Return a copy, not the original
        }

student = Student("Emma", "S12345")
print(student.add_grade("Math", 95))
print(student.add_grade("Science", 87))
print(student.add_grade("English", 92))

print(f"Student GPA: {student.get_gpa()}")
print(f"Student Info: {student.get_student_info()}")

# Try to access private attribute (will cause AttributeError if uncommented)
# print(student.__student_id)  # This would fail!

print("\n=== CLASS METHODS AND STATIC METHODS ===")

class MathUtils:
    """A utility class with static and class methods."""
    
    pi = 3.14159
    
    def __init__(self, name):
        self.name = name
    
    @staticmethod
    def add(a, b):
        """Static method - doesn't need class or instance."""
        return a + b
    
    @staticmethod
    def multiply(a, b):
        """Another static method."""
        return a * b
    
    @classmethod
    def circle_area(cls, radius):
        """Class method - uses class attribute."""
        return cls.pi * radius ** 2
    
    @classmethod
    def create_calculator(cls, name):
        """Class method as alternative constructor."""
        return cls(name)

# Using static methods (no instance needed)
print(f"5 + 3 = {MathUtils.add(5, 3)}")
print(f"4 * 7 = {MathUtils.multiply(4, 7)}")

# Using class method
print(f"Circle area (radius 5): {MathUtils.circle_area(5)}")

# Using class method as constructor
calc = MathUtils.create_calculator("My Calculator")
print(f"Calculator name: {calc.name}")

print("\n=== PRACTICAL EXAMPLE: LIBRARY SYSTEM ===")

class Book:
    """A class representing a book."""
    
    def __init__(self, title, author, isbn):
        self.title = title
        self.author = author
        self.isbn = isbn
        self.is_available = True
    
    def __str__(self):
        """String representation of the book."""
        status = "Available" if self.is_available else "Checked out"
        return f"'{self.title}' by {self.author} ({status})"

class Library:
    """A class representing a library."""
    
    def __init__(self, name):
        self.name = name
        self.books = []
        self.members = []
    
    def add_book(self, book):
        """Add a book to the library."""
        self.books.append(book)
        return f"Added '{book.title}' to {self.name}"
    
    def find_book(self, title):
        """Find a book by title."""
        for book in self.books:
            if book.title.lower() == title.lower():
                return book
        return None
    
    def checkout_book(self, title, member):
        """Check out a book to a member."""
        book = self.find_book(title)
        if book and book.is_available:
            book.is_available = False
            return f"'{book.title}' checked out to {member}"
        return f"Book '{title}' not available"
    
    def return_book(self, title):
        """Return a book to the library."""
        book = self.find_book(title)
        if book and not book.is_available:
            book.is_available = True
            return f"'{book.title}' returned successfully"
        return f"Book '{title}' was not checked out"
    
    def list_available_books(self):
        """List all available books."""
        available = [book for book in self.books if book.is_available]
        if available:
            return "\n".join(str(book) for book in available)
        return "No books available"

# Using the library system
library = Library("City Library")

book1 = Book("Python Programming", "John Smith", "123456789")
book2 = Book("Data Science Basics", "Jane Doe", "987654321")

print(library.add_book(book1))
print(library.add_book(book2))

print("\nAvailable books:")
print(library.list_available_books())

print(f"\n{library.checkout_book('Python Programming', 'Alice')}")
print(f"{library.checkout_book('Python Programming', 'Bob')}")

print("\nAvailable books after checkout:")
print(library.list_available_books())

print(f"\n{library.return_book('Python Programming')}")

print("\n🏋️ PRACTICE EXERCISES:")
print("1. Create a Rectangle class with area and perimeter methods")
print("2. Build a simple RPG character class with health, attack, defend methods")
print("3. Design a Vehicle hierarchy (Car, Motorcycle, Truck)")
print("4. Create a simple inventory management system")
print("5. Build a basic social media post class with likes and comments")
