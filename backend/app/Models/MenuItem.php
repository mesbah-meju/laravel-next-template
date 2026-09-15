<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    use HasFactory;

    protected $table = 'menu_items';

    protected $fillable = [
        'menu_id',
        'parent_id',
        'title',
        'url',
        'route',
        'route_params',
        'new_tab',
        'icon',
        'color',
        'bg_color',
        'css_class',
        'order',
        'is_active',
    ];

    protected $casts = [
        'route_params' => 'array',
        'new_tab' => 'boolean',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }

    public function parent()
    {
        return $this->belongsTo(MenuItem::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(MenuItem::class, 'parent_id')->orderBy('order');
    }

    public function getLink()
    {
        if ($this->route) {
            $params = $this->route_params;

            if (is_string($params)) {
                $params = json_decode($params, true);
            }

            return route($this->route, $params ?: []);
        }

        return $this->url ?? '#';
    }
}
