<?php

use Illuminate\Support\Facades\Route;

Route::get('/test-text', function () {
    return "<p>This is a test paragraph.</p>";
});

Route::get('/test-php-array', function () {
    $testArray = ['name' => 'John Doe', 'age' => 30, 'email' => 'john.doe@example.com'];
    return $testArray;
});

use Illuminate\Http\Request;

Route::post('/register', function (Request $request) {
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|unique:users',
        'password' => 'required|string|min:8|confirmed',
    ]);
    return [
        'message' => 'User registered successfully',
        'user' => $validated,
    ];
});
