<?php

namespace App\Traits;

use App\Services\ActivityLogger;
use Illuminate\Database\Eloquent\Model;

trait LogsActivity
{
    /**
     * Boot the trait to listen for Eloquent model events.
     */
    public static function bootLogsActivity(): void
    {
        static::created(function (Model $model) {
            $module = property_exists($model, 'activityModule') ? $model->activityModule : strtolower(class_basename($model));
            ActivityLogger::log(
                action: 'created',
                description: "Created {$module} #".$model->getKey(),
                module: $module,
                subject: $model,
                newValues: $model->getAttributes()
            );
        });

        static::updated(function (Model $model) {
            $module = property_exists($model, 'activityModule') ? $model->activityModule : strtolower(class_basename($model));
            $dirty = $model->getDirty();
            $original = array_intersect_key($model->getOriginal(), $dirty);

            ActivityLogger::log(
                action: 'updated',
                description: "Updated {$module} #".$model->getKey(),
                module: $module,
                subject: $model,
                oldValues: $original,
                newValues: $dirty
            );
        });

        static::deleted(function (Model $model) {
            $module = property_exists($model, 'activityModule') ? $model->activityModule : strtolower(class_basename($model));
            ActivityLogger::log(
                action: 'deleted',
                description: "Deleted {$module} #".$model->getKey(),
                module: $module,
                subject: $model,
                oldValues: $model->getAttributes()
            );
        });
    }
}
