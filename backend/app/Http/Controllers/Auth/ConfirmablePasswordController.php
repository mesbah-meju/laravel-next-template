<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ConfirmablePasswordController extends Controller
{
    /**
     * Show confirm password state.
     */
    public function show(): JsonResponse
    {
        return response()->json([
            'confirmed' => session()->has('auth.password_confirmed_at'),
        ]);
    }

    /**
     * Confirm the user's password.
     */
    public function store(Request $request)
    {
        if (! Auth::guard('web')->validate([
            'email' => $request->user()->email,
            'password' => $request->password,
        ])) {
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        $request->session()->put('auth.password_confirmed_at', time());

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Password confirmed successfully.',
            ]);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
