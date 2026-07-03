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
use App\Models\User;

Route::post('/register', function (Request $request) {
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|unique:users',
        'password' => 'required|string|min:8|confirmed',
    ]);
    $user = User::create($validated);
    return [
        'message' => 'User registered successfully',
        'user' => $user,
    ];
});

use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

Route::post('/login', function (Request $request) {
    $validated = $request->validate([
        'email' => 'required|string|email',
        'password' => 'required|string',    
    ]);

    $email = $validated['email'];
    $plainPassword = $validated['password'];

    $user = User::where('email', $email)->first();

    if (!$user || !Hash::check($plainPassword, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect. '],
        ]);
    };

    $token = $user->createToken('auth-token')->plainTextToken;

    return [
        'message' => 'Login successful',
        'token' => $token,
        'user' => $user,
    ];
});