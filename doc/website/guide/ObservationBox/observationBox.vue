<template>
    <SDWebglRenderer :width="720" :height="360" :backgroundColor="0x1f63d1">
        <SDOrbitControls />
        <SDScene>
            <SDPerspectiveCamera :positionX="1" :positionY="1" :positionZ="1" />
            <SDMesh>
                <SDBoxGeometry :width="1" />
                <SDMeshBasicMaterial>
                    <SDTextureLoader url="/sandi-ui/img/crate.gif" type="map" />
                </SDMeshBasicMaterial>
            </SDMesh>
        </SDScene>
    </SDWebglRenderer>
</template>

