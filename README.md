# TradeCalc — Commodity Commission Calculator

TradeCalc is a responsive web application designed to calculate brokerage commissions in international commodity trading operations.

The application allows users to estimate individual commissions based on traded quantities, contract duration, commission rates, and the number of intermediaries involved in a transaction.

## Features

- Calculate commissions for buyer and seller intermediary groups.
- Distribute commissions among group members.
- Estimate monthly and total contract earnings.
- Switch between buyer-side and seller-side calculations.
- Convert estimated earnings from USD into other currencies.
- Retrieve reference exchange rates through the Frankfurter API.
- Validate numerical inputs and handle invalid calculations.
- Reset the calculator to its default example.
- Responsive interface with a glassmorphism design.

## Technologies

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- Fetch API
- Frankfurter API
- Git and GitHub

## How to Run

1. Clone or download this repository.
2. Open the project folder.
3. Open `index.html` in your browser or use the Live Server extension in Visual Studio Code.
4. Enter the contract details and commission information.

An internet connection is required to retrieve exchange rates from the API.

## Project Structure

```text
TradeCalc/
├── index.html
├── stylesheet.css
├── index.js
├── mapa-mundial.jpg
└── README.md
```

## Purpose

TradeCalc was developed as a portfolio project combining frontend development with practical knowledge of international commodity brokerage.

It demonstrates DOM manipulation, event handling, mathematical calculations, input validation, asynchronous API requests, and responsive web design.

## Disclaimer

TradeCalc is an estimation tool. Its results are illustrative and should not be considered a contractual guarantee of commissions or exchange rates.
