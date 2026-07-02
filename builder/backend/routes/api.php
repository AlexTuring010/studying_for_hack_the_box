<?php

use Illuminate\Support\Facades\Route;

Route::get('/test-text', function () {
    return "<p>This is a test paragraph.</p>";
});

Route::get('/test-php-array', function () {
    $testArray = ['name' => 'John Doe', 'age' => 30, 'email' => 'john.doe@example.com'];
    return $testArray;
});

