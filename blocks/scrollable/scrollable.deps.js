({
    mustDeps: [
        {
            block: 'i-bem',
            elem: 'dom'
        },
        {
            block: 'events',
            elem: 'channels'
        },
        {
            block: 'functions',
            elem: 'debounce'
        },
        {
            block: 'scroll'
        },
        {
            block: 'visibility-listener'
        },
        {
            block: 'jquery'
        }
    ],
    shouldDeps: [
        {
            elems: [
                'content',
                'systemscrolls',
                'size-helper',
                'viewport'
            ]
        },
        {
            mods: {
                type: 'vertical',
                vertical: 'active',
                inited: true
            }
        }
    ]
})
