<template>
    <div id="versionModal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 id="exampleModalLabel" class="modal-title">
                        Welcome to release v{{ version }}
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <img class="img-fluid" src="../../assets/cover.jpg" alt="cover.jpg" />
                <div id="release-note-body" class="mx-4 my-4">
                    Loading release note...
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" src="./VersionModal.ts"></script>
