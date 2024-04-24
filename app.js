import express from 'express';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import open from 'open';
import path from 'path';

const app = express(); // Creates an express application
const PORT = process.env.PORT || 3000; // Dynamically sets port number for Heroku

app.set('view engine', 'ejs'); // Sets the view engine to ejs
app.use(bodyParser.urlencoded({ extended: true })); // Parses the body of the request

// Compute the directory path for 'templates' directory
const __dirname = path.dirname(new URL(import.meta.url).pathname);
app.set('views', path.join(__dirname, 'templates')); // Set the views directory to 'templates'

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/results', (req, res) => {
    const selection = req.body.selection;

    const displayMapping = {
        products: "Products",
        categories: "Categories",
        clothing: "Clothing",
        accessories: "Accessories",
        customerAccount: "Customer Account",
        vendors: "Vendors",
        reviews: "Product Reviews",
        priceUnder50: "Products Under $50",
        quantityOver50: "Quantity Over 50",
        customerAccountReference: "Customer Account References",
        vendorInventoryInfo: "Vendor Inventory"
    };

    let query = '';

    switch (selection) {
        case 'products':
            query = 'SELECT * FROM Products;';
            break;
        case 'categories':
            query = 'SELECT * FROM Categories;';
            break;
        case 'clothing':
            query = `SELECT 
                        Products.ProductID, 
                        Products.ProductName, 
                        Products.ProductDescription,
                        Categories.CategoryID,
                        Categories.CategoryName,
                        Categories.CategoryDescription,
                        Clothing.Gender AS ClothingGender,
                        Clothing.Size AS ClothingSize
                    FROM Products
                    JOIN Categories ON Products.ProductID = Categories.ProductID
                    JOIN Clothing ON Clothing.CategoryID = Categories.CategoryID;`;
            break;
        case 'accessories':
            query = `SELECT 
                        Products.ProductID, 
                        Products.ProductName, 
                        Products.ProductDescription,
                        Categories.CategoryID,
                        Categories.CategoryName,
                        Categories.CategoryDescription,
                        Accessories.AccessoriesType,
                        Accessories.Gender AS AccessoriesGender,
                        Accessories.Size AS AccessoriesSize
                    FROM Products
                    JOIN Categories ON Products.ProductID = Categories.ProductID
                    JOIN Accessories ON Categories.CategoryID = Accessories.CategoryID;`
            break;
        case 'customerAccount':
            query = 'SELECT * FROM CustomerAccount;';
            break;  
        case 'vendors':
            query = 'SELECT * FROM Vendors;';
            break;
        case 'reviews':
            query = `SELECT 
                        Products.ProductID, 
                        Products.ProductName, 
                        CustomerAccount.CustomerID, 
                        CustomerAccount.FirstName, 
                        CustomerAccount.LastName, Reviews.RatingDate, 
                        Reviews.Rating, Reviews.Comment 
                    FROM Reviews
                    JOIN Products ON Reviews.ProductID = Products.ProductID
                    JOIN CustomerAccount ON  CustomerAccount.CustomerID = Reviews.CustomerID
                    ORDER BY Reviews.Rating;`;
            break;
        case 'priceUnder50':
            query = `SELECT 
                        Products.ProductID, 
                        Products.ProductName,
                        Products.ProductDescription,
                        Products.ProductPrice,
                        Categories.CategoryID,
                        Categories.CategoryName,
                        Categories.CategoryDescription,
                        Accessories.AccessoriesType,
                        Accessories.Gender AS AccessoriesGender,
                        Accessories.Size AS AccessoriesSize
                    FROM Products
                    JOIN Categories ON Products.ProductID = Categories.ProductID
                    JOIN Accessories ON Categories.CategoryID = Accessories.CategoryID
                    WHERE ProductPrice < 50
                    ORDER BY Products.ProductPrice;`
            break;
        case 'quantityOver50':
            query = `SELECT 
                        Products.ProductID, 
                        Products.ProductName,
                        Products.ProductDescription,
                        Products.ProductPrice,
                        Products.StockQuantity,
                        Categories.CategoryID,
                        Categories.CategoryName,
                        Categories.CategoryDescription,
                        Accessories.AccessoriesType,
                        Accessories.Gender AS AccessoriesGender,
                        Accessories.Size AS AccessoriesSize
                    FROM Products
                    JOIN Categories ON Products.ProductID = Categories.ProductID
                    JOIN Accessories ON Categories.CategoryID = Accessories.CategoryID
                    WHERE StockQuantity > 50
                    ORDER BY StockQuantity;`
            
            break;
        case 'customerAccountReference':
            query = `SELECT 
                        c.CustomerID as CustomerID, 
                        c.FirstName as CustomerFirstName, 
                        c.LastName as CustomerLastName, 
                        f.CustomerID as ReferenceID, 
                        f.FirstName as CustomerReferenceFirstName, 
                        f.LastName as CustomerReferenceLastName 
                    FROM CustomerAccount c
                    JOIN CustomerAccount f ON c.ReferredByCustomerID = f.CustomerID;`
            break;
        case 'vendorInventoryInfo':
            query = `SELECT
                       Vendors.Name AS VendorName,
                       SUM(Products.StockQuantity) AS TotalInventoryStock,
                       SUM(Products.ProductPrice) AS DollarAmountItems,
                       (SUM(Products.StockQuantity) * SUM(Products.ProductPrice)) AS TotalDollarInInventory
                    FROM Products
                    JOIN Vendors ON Products.VendorID = Vendors.VendorID
                    GROUP BY VendorName
                    ORDER BY TotalDollarInInventory;`
            break;
        default:
            return res.send('Invalid selection');
    }
    const db = new sqlite3.Database('./TeamFour.db', sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error('Error opening database', err.message);
            return res.send('Error opening database');
        }
    });

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error executing query", err.message);
            return res.send("Error executing query");
        }
        db.close(() => {
            res.render('results', { selectedTable: displayMapping[selection] || selection, results: rows });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
        open(`http://localhost:${PORT}`);
    }
});