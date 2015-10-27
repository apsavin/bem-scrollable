({
    mustDeps: [
        'i-bem__dom',
        {
            block: 'jquery',
            elem: 'event',
            elem: { type: 'pointernative' }
        }
    ],
    shouldDeps: [
        {
            block: 'jquery',
            elem: 'selection-switching'
        },
        {
            elems: [
                'thumb',
                'track'
            ],
            mods: {
                active: true,
                dragging: true,
                type: [
                    'vertical'
                ]
            }
        }
    ]
})
