<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'items' => 'sometimes|array',
            'items.*.title' => 'required_with:items|string|max:255',
            'items.*.url' => 'nullable|string',
            'items.*.route' => 'nullable|string',
            'items.*.route_params' => 'nullable|array',
            'items.*.new_tab' => 'nullable|boolean',
            'items.*.icon' => 'nullable|string',
            'items.*.color' => 'nullable|string',
            'items.*.bg_color' => 'nullable|string',
            'items.*.css_class' => 'nullable|string',
            'items.*.order' => 'nullable|integer',
            'items.*.is_active' => 'nullable|boolean',
            'items.*.children' => 'nullable|array',
        ];
    }
}
